import { defineEventHandler, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  let body:any = {}; try { body = await readBody(event) } catch {}
  const question = String(body?.question || '').trim()
  if (!question) { setResponseStatus(event, 400); return { error: 'question is required' } }

  // TEMP stub
  return {
    question,
    answer: `Stub answer for: ${question}`,
    sources: [{ path: '/stub', score: 1 }]
  }
})






