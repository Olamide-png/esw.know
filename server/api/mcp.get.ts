// server/api/mcp.get.ts
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  // Treat GET the same as POST with action=ping unless the client passes ?action=...
  const q = getQuery(event)
  const action = typeof q.action === 'string' ? q.action : 'ping'
  // Call your existing POST handler by sending a small body to it:
  const res = await $fetch('/api/mcp', {
    method: 'POST',
    headers: { accept: 'text/event-stream' },
    body: { action }
  })
  return res
})
