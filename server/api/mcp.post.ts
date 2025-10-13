// server/api/mcp.post.ts
import {
  defineEventHandler,
  readRawBody,
  getHeader,
  setResponseStatus,
  setResponseHeader,
} from 'h3'

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sidecar target:
 *  - Use /mcp for JSON-RPC servers.
 *  - Use /ask for NLWeb sidecar (adapter mode).
 */
const MCP_URL = process.env.MCP_URL || 'http://127.0.0.1:7015/ask'
const IS_MCP = MCP_URL.endsWith('/mcp')

/** Optional bearer to protect this route (incoming client → Nuxt) */
const SERVER_BEARER = process.env.MCP_SERVER_BEARER || ''

/** Optional bearer to forward to the sidecar (Nuxt → sidecar) */
const SIDECAR_BEARER = process.env.MCP_SIDECAR_BEARER || ''

/** Upstream timeout (ms) */
const MCP_TIMEOUT_MS = Number(process.env.MCP_TIMEOUT_MS || 15000)

// ─────────────────────────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────────────────────────

function toUtf8(u?: string | Uint8Array | null) {
  if (!u) return ''
  return typeof u === 'string' ? u : new TextDecoder().decode(u)
}

function badRequest(event: any, message: string, details?: any) {
  setResponseStatus(event, 400)
  return { ok: false, error: 'invalid_params', message, details }
}

function unauthorized(event: any, message = 'Unauthorized') {
  setResponseStatus(event, 401)
  return { ok: false, error: 'unauthorized', message }
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n))
}

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
      try { yield JSON.parse(json) } catch { /* ignore partials */ }
    }
  }
  if (buf.startsWith('data:')) {
    const json = buf.slice(5).trimStart()
    try { yield JSON.parse(json) } catch {}
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Tool validators (no external deps)
// ─────────────────────────────────────────────────────────────────────────────

type Dict = Record<string, any>

function validateDocLookupParams(params: Dict) {
  const errs: string[] = []
  if (!params || typeof params !== 'object') errs.push('params must be object')
  if (typeof params?.path !== 'string' || params.path.length === 0) {
    errs.push('params.path (string) is required')
  }
  if (params?.query != null && typeof params.query !== 'string') {
    errs.push('params.query must be a string when provided')
  }
  return { ok: errs.length === 0, errors: errs }
}

function validateDocSearchParams(params: Dict) {
  const errs: string[] = []
  if (!params || typeof params !== 'object') errs.push('params must be object')
  if (typeof params?.query !== 'string' || params.query.length === 0) {
    errs.push('params.query (string) is required')
  }
  if (params?.k != null) {
    if (typeof params.k !== 'number' || !Number.isInteger(params.k)) {
      errs.push('params.k must be an integer')
    } else if (params.k < 1 || params.k > 20) {
      errs.push('params.k must be between 1 and 20')
    }
  }
  return { ok: errs.length === 0, errors: errs }
}

function validateDocExtractParams(params: Dict) {
  const errs: string[] = []
  if (!params || typeof params !== 'object') errs.push('params must be object')
  if (typeof params?.path !== 'string' || params.path.length === 0) {
    errs.push('params.path (string) is required')
  }
  if (params?.max_chars != null) {
    if (typeof params.max_chars !== 'number' || !Number.isInteger(params.max_chars)) {
      errs.push('params.max_chars must be an integer')
    } else if (params.max_chars < 100 || params.max_chars > 200000) {
      errs.push('params.max_chars must be between 100 and 200000')
    }
  }
  return { ok: errs.length === 0, errors: errs }
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter: MCP “tool.call” -> sidecar /ask payload
// ─────────────────────────────────────────────────────────────────────────────

function adaptToolCallToAsk(event: any, body: any) {
  if (!body || body.action !== 'tool.call') return { outbound: null }

  const { tool, params = {} } = body as { tool: string, params: Dict }

  // Force local Postgres retrieval; no web.
  const base = {
    site: 'local',
    retriever: 'postgres',
    store: 'postgres',
    web: false,
    disable_search: true,
    search: { disable: true },
    source_hints: { mode: 'local', store: 'postgres', web: false },
    handler: 'retriever',
    tool: 'retriever',
    chain: 'retriever',
    mode: 'rag',
    rag: true,
  }

  if (tool === 'doc_lookup') {
    const v = validateDocLookupParams(params)
    if (!v.ok) return { error: badRequest(event, 'Invalid doc_lookup params', v.errors) }

    const query = params.query ?? ''
    const path = params.path
    return {
      outbound: {
        ...base,
        query,
        path,
        force_path_mode: true,
        use_path: true,
        path_only: true,
        retrieval: { use_path: true },
      }
    }
  }

  if (tool === 'doc_search') {
    const v = validateDocSearchParams(params)
    if (!v.ok) return { error: badRequest(event, 'Invalid doc_search params', v.errors) }

    const k = clamp(params.k ?? 5, 1, 20)
    const query = params.query
    return {
      outbound: {
        ...base,
        query,
        top_k: k,
        use_path: false,
        path_only: false,
        retrieval: { use_path: false, top_k: k },
      }
    }
  }

  if (tool === 'doc_extract') {
    const v = validateDocExtractParams(params)
    if (!v.ok) return { error: badRequest(event, 'Invalid doc_extract params', v.errors) }

    const path = params.path
    const maxChars = clamp(params.max_chars ?? 12000, 100, 200000)
    return {
      outbound: {
        ...base,
        query: '',
        path,
        force_path_mode: true,
        use_path: true,
        path_only: true,
        retrieval: { use_path: true, return_text: true, maxChars },
        maxChars,
      }
    }
  }

  // Unknown tool — in adapter mode this won’t be mapped.
  return { outbound: null }
}

// ─────────────────────────────────────────────────────────────────────────────
// Handler
// ─────────────────────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  // Security: optional bearer on this route
  if (SERVER_BEARER) {
    const auth = getHeader(event, 'authorization') || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (token !== SERVER_BEARER) {
      return unauthorized(event)
    }
  }

  // Diagnostics
  setResponseHeader(event, 'x-mcp-url', MCP_URL)
  setResponseHeader(event, 'x-mcp-mode', IS_MCP ? 'jsonrpc' : 'ask-adapter')
  setResponseHeader(event, 'x-mcp-timeout-ms', String(MCP_TIMEOUT_MS))

  // Request parsing
  const raw = await readRawBody(event)
  const text = toUtf8(raw)
  let body: any = {}
  try { body = text ? JSON.parse(text) : {} } catch { body = {} }

  // local smoke
  if (body?.__smoke) {
    return { ok: true, route: '/api/mcp', ts: new Date().toISOString(), raw: text || null }
  }

  // Local synthetic ping
  const accept = getHeader(event, 'accept') || ''
  const wantSSE = accept.includes('text/event-stream')
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
      res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', id: null, result: { ok: true, ts: now } })}\n\n`)
      res.end()
      return
    }
    return { ok: true, route: '/api/mcp', ts: new Date().toISOString() }
  }

  // Build outbound request
  let target = MCP_URL
  let outbound: any = body

  if (!IS_MCP) {
    const adapted = adaptToolCallToAsk(event, body)
    if ((adapted as any)?.error) return (adapted as any).error
    if (adapted.outbound) outbound = adapted.outbound
  }

  // Abort/timeout controls
  const controller = new AbortController()
  const onClose = () => controller.abort()
  event.node.req.on('close', onClose)
  event.node.req.on('aborted', onClose)

  const timeout = setTimeout(() => controller.abort(), MCP_TIMEOUT_MS)

  // Propagate trace + auth to sidecar
  const clientTraceId = getHeader(event, 'x-trace-id') || crypto.randomUUID()
  const incomingAuth = getHeader(event, 'authorization') || ''
  const sidecarAuth =
    SIDECAR_BEARER ? `Bearer ${SIDECAR_BEARER}` :
    incomingAuth.startsWith('Bearer ') ? incomingAuth : ''

  let res: Response
  try {
    res = await fetch(target, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'accept': 'text/event-stream',
        ...(sidecarAuth ? { 'authorization': sidecarAuth } : {}),
        'x-trace-id': clientTraceId,
      },
      body: JSON.stringify(outbound),
      signal: controller.signal,
    })
  } catch (e: any) {
    clearTimeout(timeout)
    event.node.req.off('close', onClose)
    event.node.req.off('aborted', onClose)
    const aborted = e?.name === 'AbortError'
    setResponseStatus(event, aborted ? 504 : 502)
    return { ok: false, error: aborted ? 'upstream_timeout' : 'upstream_unavailable' }
  } finally {
    clearTimeout(timeout)
    event.node.req.off('close', onClose)
    event.node.req.off('aborted', onClose)
  }

  setResponseStatus(event, res.status)

  // SSE passthrough
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

  // Aggregate SSE → JSON
  const stream = res.body
  if (!stream) {
    return { ok: false, error: 'no_body', status: res.status }
  }

  const messages: any[] = []
  for await (const msg of sseJsonIterator(stream)) messages.push(msg)

  // If upstream is non-2xx and we saw no frames, surface an error
  if (!res.ok && messages.length === 0) {
    return { ok: false, error: 'upstream_error', status: res.status }
  }

  const final =
    messages.find(m => m.message_type === 'final_answer') ??
    messages.find(m => m.message_type === 'result') ??
    messages.find(m => m.message_type === 'end-nlweb-response') ??
    { messages }

  event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return { ok: true, result: final, mode: IS_MCP ? 'jsonrpc' : 'ask-adapter' }
})





















