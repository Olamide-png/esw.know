// server/api/mcp.post.ts
import {
  defineEventHandler, readRawBody, getHeader, setResponseStatus
} from 'h3'

/**
 * Point this at your sidecar.
 * - If your sidecar exposes /mcp (JSON-RPC), use that URL.
 * - If it only has /ask, point to /ask and we'll map simple tool calls.
 */
const MCP_URL = process.env.MCP_URL || 'http://127.0.0.1:7015/ask'
const IS_MCP = MCP_URL.endsWith('/mcp')

const MCP_SERVER_BEARER = process.env.MCP_SERVER_BEARER || ''
const MCP_SIDECAR_BEARER = process.env.MCP_SIDECAR_BEARER || ''
const MCP_TIMEOUT_MS = Number.parseInt(process.env.MCP_TIMEOUT_MS || '', 10) || 15000

function toUtf8(u?: string | Uint8Array | null) {
  if (!u) return ''
  return typeof u === 'string' ? u : new TextDecoder().decode(u)
}

// Map simple MCP “tool.call” into an /ask body (basic adapter).
function adaptToolCallToAsk(body: any) {
  if (!body || body.action !== 'tool.call') return null
  const { tool, params = {} } = body

  // common hints to stay local, postgres, and disable web search
  const common = {
    site: 'local',
    retriever: 'postgres',
    store: 'postgres',
    web: false,
    disable_search: true,
    search: { disable: true },
    source_hints: { mode: 'local', store: 'postgres', web: false }
  } as const

  if (tool === 'doc_lookup') {
    const query = params.query ?? params.q ?? ''
    const path  = params.path ?? params.url ?? ''
    return {
      ...common,
      query,
      path,
      handler: 'retriever',
      tool: 'retriever',
      chain: 'retriever',
      mode: 'rag',
      rag: true,
      force_path_mode: true,
      use_path: true,
      path_only: true,
      retrieval: { use_path: true }
    }
  }

  if (tool === 'doc_search') {
    const query = params.query ?? params.q ?? ''
    const k = Math.max(1, Math.min(20, Number(params.k ?? 5) || 5))
    return {
      ...common,
      query,
      mode: 'rag',
      rag: true,
      num_results: k
    }
  }

  if (tool === 'doc_extract') {
    const path = params.path ?? params.url ?? ''
    return {
      ...common,
      query: '',
      path,
      handler: 'retriever',
      tool: 'retriever',
      chain: 'retriever',
      mode: 'rag',
      rag: true,
      force_path_mode: true,
      use_path: true,
      path_only: true,
      retrieval: { use_path: true }
    }
  }

  // Unknown tool — let the sidecar decide
  return null
}

// Parse SSE (server-sent events) into JSON messages
async function* sseJsonIterator(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const dec = new TextDecoder()
  let buf = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let i
    while ((i = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, i).trimEnd()
      buf = buf.slice(i + 1)
      if (!line.startsWith('data:')) continue
      const json = line.slice(5).trimStart()
      if (!json) continue
      try { yield JSON.parse(json) } catch { /* ignore partial */ }
    }
  }
  if (buf.startsWith('data:')) {
    const json = buf.slice(5).trimStart()
    try { yield JSON.parse(json) } catch {}
  }
}

export default defineEventHandler(async (event) => {
  // --- Auth (optional) ---
  if (MCP_SERVER_BEARER) {
    const auth = getHeader(event, 'authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (token !== MCP_SERVER_BEARER) {
      setResponseStatus(event, 401)
      return { ok: false, error: 'unauthorized', message: 'Unauthorized' }
    }
  }

  // 0) Read body (and smoke fast-path)
  const raw = await readRawBody(event)
  const text = toUtf8(raw)
  let body: any = {}
  try { body = text ? JSON.parse(text) : {} } catch { body = {} }

  if (body?.__smoke) {
    return { ok: true, route: '/api/mcp', ts: new Date().toISOString(), raw: text || null }
  }

  const accept = getHeader(event, 'accept') || ''
  const wantSSE = accept.includes('text/event-stream')

  // Local synthetic ping so clients can self-test even if sidecar has no /mcp ping
  if (body?.action === 'ping') {
    if (wantSSE) {
      const res = event.node.res
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      // @ts-ignore
      if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders()
      const now = Date.now()
      // one-shot SSE “pong”
      res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', id: null, result: { ok: true, ts: now } })}\n\n`)
      res.end()
      return
    }
    // JSON clients
    return { ok: true, route: '/api/mcp', ts: new Date().toISOString() }
  }

  // 1) Build outbound request
  let target = MCP_URL
  let outbound: any = body
  const mode = IS_MCP ? 'mcp' : 'ask-adapter'

  if (!IS_MCP) {
    // Sidecar doesn’t have /mcp. Try to adapt tool.call → /ask
    const maybeAsk = adaptToolCallToAsk(body)
    if (maybeAsk) outbound = maybeAsk
    target = MCP_URL // e.g., http://127.0.0.1:7015/ask
  }

  // Helpful headers so clients can introspect
  event.node.res.setHeader('x-mcp-url', target)
  event.node.res.setHeader('x-mcp-mode', mode)
  event.node.res.setHeader('x-mcp-timeout-ms', String(MCP_TIMEOUT_MS))

  // 2) Abort if client disconnects or timeout
  const controller = new AbortController()
  const onClose = () => controller.abort()
  event.node.req.on('close', onClose)
  event.node.req.on('aborted', onClose)
  const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Ask the sidecar for SSE always; we’ll convert if client wants JSON
        'accept': 'text/event-stream',
        ...(MCP_SIDECAR_BEARER ? { 'authorization': `Bearer ${MCP_SIDECAR_BEARER}` } : {})
      },
      body: JSON.stringify(outbound),
      signal: controller.signal
    })
  } catch (e: any) {
    clearTimeout(timeout)
    event.node.req.off('close', onClose)
    event.node.req.off('aborted', onClose)
    if (e?.name === 'AbortError') {
      setResponseStatus(event, 504)
      return { ok: false, error: 'timeout', message: `Upstream timed out after ${MCP_TIMEOUT_MS}ms` }
    }
    setResponseStatus(event, 502)
    return { ok: false, error: 'upstream_unavailable', message: 'Upstream unavailable' }
  }

  clearTimeout(timeout)
  event.node.req.off('close', onClose)
  event.node.req.off('aborted', onClose)

  setResponseStatus(event, res.status)

  // 3) SSE passthrough when caller asked for it
  if (wantSSE) {
    const h = event.node.res
    h.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    h.setHeader('Cache-Control', 'no-cache, no-transform')
    h.setHeader('Connection', 'keep-alive')
    h.setHeader('X-Accel-Buffering', 'no')
    // @ts-ignore
    if (typeof (h as any).flushHeaders === 'function') (h as any).flushHeaders()

    const stream = res.body
    if (!stream) { h.end(); return }
    const reader = (stream as ReadableStream<Uint8Array>).getReader()
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        h.write(Buffer.isBuffer(value) ? value : Buffer.from(value))
        await new Promise(r => setImmediate(r))
      }
    } catch {
      if (!h.writableEnded) { try { h.end() } catch {} }
      return
    }
    if (!h.writableEnded) h.end()
    return
  }

  // 4) JSON callers → aggregate SSE into one JSON object
  const stream = res.body
  if (!stream) return { ok: false, reason: 'no-body' }

  const messages: any[] = []
  for await (const msg of sseJsonIterator(stream as ReadableStream<Uint8Array>)) messages.push(msg)

  // If this was a doc_extract request, transform to { path, title, text }
  const isDocExtract =
    body &&
    body.action === 'tool.call' &&
    body.tool === 'doc_extract'

  if (isDocExtract) {
    let out: any = { ok: true, path: null, title: null, text: '' }
    try {
      const resultMsg =
        messages.find(m => m.message_type === 'result') ||
        messages
          .slice()
          .reverse()
          .find(m => m.message_type === 'result')

      const item =
        resultMsg?.content?.[0] && typeof resultMsg.content[0] === 'object'
          ? resultMsg.content[0]
          : null

      const schema = item?.schema_object || {}
      const path = schema.path || item?.url || null
      const title = schema.title || item?.name || null
      let text: string = schema.text || ''

      const maxChars =
        typeof body.params?.max_chars === 'number'
          ? Math.max(1, Math.min(200000, body.params.max_chars))
          : 14000

      if (text && text.length > maxChars) text = text.slice(0, maxChars)

      out = { ok: true, path, title, text }
    } catch {
      out = { ok: true, messages }
    }

    event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return out
  }

  // Normal (non-extract) path → return a helpful last object
  const final =
    messages.find(m => m.message_type === 'final_answer') ||
    messages.find(m => m.message_type === 'result') ||
    messages.find(m => m.message_type === 'end-nlweb-response') ||
    { ok: true, messages }

  event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return final
})
























