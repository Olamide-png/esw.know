// Force Node runtime on Vercel/edge platforms
export const runtime = 'node'

import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ question?: string }>(event)

  // TODO: put your real logic here (OpenAI / RAG / etc.)
  return {
    ok: true,
    route: '/api/nlweb/query',
    received: body ?? null
  }
})
