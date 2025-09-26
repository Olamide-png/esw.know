export const runtime = 'node'

import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ q?: string }>(event)

  // TODO: implement your real search logic (vector DB, etc.)
  return {
    ok: true,
    route: '/api/nlweb/search',
    received: body ?? null
  }
})
