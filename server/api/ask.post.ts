// /server/api/ask.post.ts
import { defineEventHandler, readBody, getHeader, setResponseStatus } from 'h3'

const SIDE_CAR = 'http://127.0.0.1:7015/ask'
const FIRST_BYTE_TIMEOUT_MS = 5000
const TOTAL_TIMEOUT_MS = 25000

async function* sseJsonIterator(stream: any) {
  const reader = stream.getReader(), dec = new TextDecoder()
  let buf = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buf += dec.decode(value, { stream: true })
    let nl
    while ((nl = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, nl).trimEnd()
      buf = buf.slice(nl + 1)
      if (!line.startsWith('data:')) continue
      const p = line.slice(5).trimStart()
      if (p) { try { yield JSON.parse(p) } catch {} }
    }
  }
  if (buf.startsWith('data:')) { const p = buf.slice(5).trimStart(); try { yield JSON.parse(p) } catch {} }
}

export default defineEventHandler(async (event) => {
  const accept = (getHeader(event, 'accept') || '').toLowerCase()
  const wantSSE = accept.includes('text/event-stream')

  // Normalize → force local Postgres RAG & disable web/search
  const incoming = (await readBody(event).catch(() => ({}))) || {}
  const q = incoming.query ?? incoming.question ?? ''
  const path = incoming.path ?? incoming.url ?? ''
  const outbound = JSON.stringify({
    ...incoming,
    query: q,
    path,
    url: incoming.url ?? path,
    site: 'local',
    retriever: 'postgres',
    store: 'postgres',
    source_hints: { mode: 'local', store: 'postgres', web: false },
    search: { disable: true }, disable_search: true, web: false,
  })

  const ctrl = new AbortController()
  const fail = (code: number, msg: string) => {
    try { ctrl.abort() } catch {}
    setResponseStatus(event, code)
    if (wantSSE) {
      event.node.res.write(`event: error\ndata: ${JSON.stringify({ error: msg })}\n\n`)
      event.node.res.end(); return
    }
    event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8')
    return { ok: false, error: msg }
  }
  const totalTimer = setTimeout(() => fail(504, 'Upstream total timeout'), TOTAL_TIMEOUT_MS)

  let upstream: Response
  try {
    upstream = await fetch(SIDE_CAR, {
      method: 'POST',
      headers: { accept: 'text/event-stream', 'content-type': 'application/json' },
      body: outbound,
      signal: ctrl.signal,
    })
  } catch {
    clearTimeout(totalTimer)
    setResponseStatus(event, 502)
    return { ok: false, error: 'Upstream unavailable' }
  }

  setResponseStatus(event, upstream.status)
  const body = upstream.body
  if (!body) { clearTimeout(totalTimer); setResponseStatus(event, 502); return { ok: false, error: 'No body from sidecar' } }

  // SSE passthrough (if client asked for it)
  if (wantSSE) {
    const h = event.node.res
    h.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
    h.setHeader('Cache-Control', 'no-cache, no-transform')
    h.setHeader('Connection', 'keep-alive')
    // @ts-ignore
    if (typeof (h as any).flushHeaders === 'function') (h as any).flushHeaders()

    const reader = body.getReader()
    let first = true
    const fbTimer = setTimeout(() => { if (first) fail(504, 'Upstream first-byte timeout') }, FIRST_BYTE_TIMEOUT_MS)
    try {
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        first && (first = false, clearTimeout(fbTimer))
        h.write(Buffer.isBuffer(value) ? value : Buffer.from(value))
        await new Promise(r => setImmediate(r))
      }
    } catch {}
    clearTimeout(fbTimer); clearTimeout(totalTimer)
    if (!h.writableEnded) h.end()
    return
  }

  // Aggregate SSE → one JSON (with error surfacing)
  let got = false
  const fbTimer = setTimeout(() => { if (!got) fail(504, 'Upstream first-byte timeout') }, FIRST_BYTE_TIMEOUT_MS)
  const msgs: any[] = []
  try { for await (const m of sseJsonIterator(body)) { got = true; msgs.push(m) } } catch {}
  clearTimeout(fbTimer); clearTimeout(totalTimer)

  let lastErr: any = null
  for (const m of msgs) if (m?.message_type === 'error' || m?.error) lastErr = m
  const final = lastErr ? { ok: false, error: lastErr.error || lastErr } :
    msgs.find((m: any) => m.message_type === 'final_answer') ??
    msgs.find((m: any) => m.message_type === 'end-nlweb-response') ??
    { ok: true, messages: msgs }

  event.node.res.setHeader('Content-Type', 'application/json; charset=utf-8')
  return final
})














