// /server/api/mcp.post.ts
import {
  defineEventHandler,
  readRawBody,
  getHeader,
  setResponseStatus,
} from 'h3'

const SIDE_CAR = 'http://127.0.0.1:7015/mcp'

export default defineEventHandler(async (event) => {
  const raw = await readRawBody(event)
  const accept = getHeader(event, 'accept') || 'application/json'
  const contentType = getHeader(event, 'content-type') || 'application/json'

  const controller = new AbortController()
  const onClose = () => controller.abort()
  event.node.req.on('close', onClose)
  event.node.req.on('aborted', onClose)

  let res: Response
  try {
    res = await fetch(SIDE_CAR, {
      method: 'POST',
      headers: { accept, 'content-type': contentType },
      body: raw ?? '',
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

  const h = event.node.res
  const upstreamCT = res.headers.get('content-type') || (accept.includes('event-stream')
    ? 'text/event-stream; charset=utf-8'
    : 'application/json; charset=utf-8')
  h.setHeader('Content-Type', upstreamCT)
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
})




