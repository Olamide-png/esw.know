// server/api/mcp-smoke.get.ts
import { defineEventHandler } from 'h3'

export default defineEventHandler(() => {
  return { ok: true, route: '/api/mcp-smoke', ts: new Date().toISOString() }
})


