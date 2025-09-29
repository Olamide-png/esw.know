import { defineEventHandler, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  let body:any = {}; try { body = await readBody(event) } catch {}
  const query = String(body?.query || '').trim()
  if (!query) { setResponseStatus(event, 400); return { error: 'query is required' } }

  // TEMP stub so you can prove JSON end-to-end
  return {
    query,
    chunks: [
      { doc_id: '/stub/doc', chunk_id: '/stub/doc::0', heading: 'Stub', content: 'Example stub content', score: 0.99 }
    ]
  }
})






