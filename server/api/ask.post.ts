// /server/api/ask.post.ts
import {
  defineEventHandler,
  readRawBody,
  getHeader,
  setResponseStatus,
} from 'h3'

const SIDE_CAR = 'http://127.0.0.1:7015/ask'

// Parse an SSE byte stream into discrete JSON messages (from `data: ...` lines)
async function* sseJsonIterator(stream: ReadableStream<Uint8Array>) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trimEnd()
      buf = buf.slice(idx + 1)
      if (!line.startsWith('data:')) continue
      const json = line.slice(5).trimStart()
      if (!json) continue
      try { yield JSON.parse(json) } catch { /* ignore partials */ }
    }
  }
  // flush last line
  if (buf.startsWith('data:')) {
    const json = buf.slice(5).trimStart()
    try { yield JSON.parse(json) } catch {}
  }
}

export default defineEventHandler(async (event) => {
  // Normalize body (ensure `query`)
  const raw = await readRawBody(event)
  let outboundBody: string | Uint8Array = raw ?? ''
  try {
    const text = typeof raw === 'string' ? raw : new TextDecoder().decode(raw || new Uint8Array())
    const json = text ? JSON.parse(text) : {}
    if (json && typeof json === 'object') {
      const q = json.query ?? json.question ?? ''
      const path = json.path ?? json.url ?? ''
      outboundBody = JSON.stringify({ ...json, query: q, path, url: json.url ?? path })
    }
  } catch { /* forward raw */ }

  const wantSSE = (getHeader(event, 'accept') || '').includes('text/event-stream')

  // Abort upstream if client disconnects
  const controller = new AbortController()
  const onClose = () => controller.abort()
  event.node.req.on('close', onClose)
  event.node.req.on('aborted', onClose)

  let res: Response
  try {
    res = await fetch(SIDE_CAR, {
      method: 'POST',
      // Always ask the sidecar for SSE; we’ll convert to JSON if needed
      headers: { accept: 'text/event-stream', 'content-type': 'application/json' },
      body: outboundBody,
      signal: controller.signal,
    })
  } catch (err: any) {
    setResponseStatus(event, err?.name === 'AbortError' ? 499 : 502)
    return { error: err?.name === 'AbortError' ? 'Client closed request' : 'Upstream unavailable' }
  } finally {
    event.node.req.off('close', onClose)
    event.node.req.off('aborted', onClose)
  }

  setResponseStatus(event, res.status)

  // Mode A: client wants SSE → raw passthrough with early flush
  if (wantSSE) {
    const h = event.node.res
    h.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    h.setHeader('Cache-Control', 'no-cache, no-transform')
    h.setHeader('Connection', 'keep-alive')
    h.setHeader('X-Accel-Buffering', 'no')
    // @ts-ignore
    if (typeof h.flushHeaders === 'function') h.flushHeaders()

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

  // Mode B: client wants JSON → consume SSE and aggregate to one JSON
  const stream = res.body
  if (!stream) return { ok: false, reason: 'no-body' }

  const messages: any[] = []
  for await (const msg of sseJsonIterator(stream)) messages.push(msg)

  // Heuristic: pick a useful final object if present
  const final =
    messages.find(m => m.message_type === 'final_answer') ||
    messages.find(m => m.message_type === 'end-nlweb-response') ||
    { ok: true, messages }

  // Ensure JSON content type
  event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return final
})





