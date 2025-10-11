// /server/api/ask.post.ts  (TEMP SMOKE TEST)
import { defineEventHandler, readBody } from 'h3'
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null)
  event.node.res.setHeader('X-Ask-Smoke', 'yes')
  return { ok: true, echo: body, ts: new Date().toISOString() }
})











