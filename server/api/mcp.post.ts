// server/api/mcp.post.ts
import {
  defineEventHandler, readRawBody, getHeader, setResponseStatus, setHeader
} from 'h3'

/** Point this at your sidecar.
 * If it ends with /mcp -> JSON-RPC passthrough
 * Else -> /ask adapter (maps tool.call to /ask body)
 */
const MCP_URL = process.env.MCP_URL || 'http://127.0.0.1:7015/ask'
const IS_MCP = MCP_URL.endsWith('/mcp')

function toUtf8(u?: string | Uint8Array | null) {
  if (!u) return ''
  return typeof u === 'string' ? u : new TextDecoder().decode(u)
}

// Map MCP tool calls to sidecar /ask
function adaptToolCallToAsk(body: any) {
  if (!body || body.action !== 'tool.call') return null
  const { tool, params = {} } = body

  const base = {
    site: 'local',
    retriever: 'postgres',
    store: 'postgres',
    web: false,
    disable_search: true,
    search: { disable: true },
    source_hints: { mode: 'local', store: 'postgres', web: false },
    mode: 'rag',
    rag: true,
    handler: 'retriever',
    tool: 'retriever',
    chain: 'retriever'
  } as const

  if (tool === 'doc_lookup') {
    const query = params.query ?? params.q ?? ''
    const path  = params.path  ?? params.url ?? ''
    return {
      ...base,
      query,
      path,
      force_path_mode: true,
      use_path: true,
      path_only: true,
      retrieval: { use_path: true }
    }
  }

  if (tool === 'doc_search') {
    const query = params.query ?? params.q ?? ''
    const k = Math.max(1, Math.min(20, Number(params.k ?? 5)))
    return { ...base, query, num_results: k }
  }

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
  // Read body
  const raw = await readRawBody(event)
  const text = toUtf8(raw)
  let body: any = {}
  try { body = text ? JSON.parse(text) : {} } catch { body = {} }

  // Debug headers
  setHeader(event, 'x-mcp-url', MCP_URL)
  setHeader(event, 'x-mcp-mode', IS_MCP ? 'jsonrpc' : 'ask-adapter')

  // Local smoke
  if (body?.__smoke) {
    return { ok: true, route: '/api/mcp', ts: new Date().toISOString(), raw: text || null }
  }

  const accept = getHeader(event, 'accept') || ''
  const wantSSE = accept.includes('text/event-stream')

  // Local ping (works regardless of sidecar)
  if (body?.action === 'ping' || (body?.method === 'ping')) {
    if (wantSSE) {
      const res = event.node.res
      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      res.setHeader('Cache-Control', 'no-cache, no-transform')
      res.setHeader('Connection', 'keep-alive')
      res.setHeader('X-Accel-Buffering', 'no')
      // @ts-ignore
      if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders()
      const now = Date.now()
      const payload = IS_MCP
        ? { jsonrpc: '2.0', id: body?.id ?? null, result: { ok: true, ts: now } }
        : { jsonrpc: '2.0', id: null, result: { ok: true, ts: now } }
      res.write(`data: ${JSON.stringify(payload)}\n\n`)
      res.end()
      return
    }
    return { ok: true, route: '/api/mcp', ts: new Date().toISOString() }
  }

  // Build outbound
  let target = MCP_URL
  let outbound: any = body

  if (!IS_MCP) {
    // ask-adapter mode
    const maybeAsk = adaptToolCallToAsk(body)
    if (maybeAsk) outbound = maybeAsk
    // ensure we’re hitting /ask
    target = MCP_URL
  } // else: JSON-RPC passthrough as-is

  // Abort if client disconnects
  const controller = new AbortController()
  const onClose = () => controller.abort()
  event.node.req.on('close', onClose)
  event.node.req.on('aborted', onClose)

  let res: Response
  try {
    res = await fetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Always ask stream from sidecar; we’ll aggregate for JSON callers
        'accept': 'text/event-stream'
      },
      body: JSON.stringify(outbound),
      signal: controller.signal
    })
  } catch (e: any) {
    setResponseStatus(event, e?.name === 'AbortError' ? 499 : 502)
    return { error: e?.name === 'AbortError' ? 'Client closed request' : 'Upstream unavailable' }
  } finally {
    event.node.req.off('close', onClose)
    event.node.req.off('aborted', onClose)
  }

  setResponseStatus(event, res.status)

  // SSE passthrough for clients requesting SSE
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
    const reader = stream.getReader()
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

  // Aggregate SSE → one JSON object (for JSON callers)
  const stream = res.body
  if (!stream) return { ok: false, reason: 'no-body' }

  const messages: any[] = []
  for await (const msg of sseJsonIterator(stream)) messages.push(msg)

  // Common “final” picks (covers both /ask and JSON-RPC result frames)
  const final =
    messages.find(m => m.message_type === 'final_answer') ||
    messages.find(m => m.message_type === 'result') ||
    messages.find(m => m.jsonrpc === '2.0' && Object.hasOwn(m, 'result')) ||
    messages.find(m => m.message_type === 'end-nlweb-response') ||
    { ok: true, messages }

  event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return final
})



















