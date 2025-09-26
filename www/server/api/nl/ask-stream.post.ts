import { defineEventHandler, readBody, sendStream } from 'h3'
import { Readable } from 'node:stream'
import { query as runQuery } from '@/server/nlweb/query'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ query: string }>(event)
  const question = body?.query?.trim()
  if (!question) {
    event.node.res.statusCode = 400
    return { error: 'Missing query' }
  }

  // Minimal SSE shim: run once and stream as a few events so your UI works.
  const res = await runQuery({ question, mode: 'generate' as const })
  const text = res?.text || ''
  const sources = res?.citation || []

  const chunks: string[] = []
  // send sources first
  chunks.push(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`)
  // then stream the text in a few slices
  const parts = text.match(/.{1,500}/gs) || ['']
  for (const p of parts) chunks.push(`event: delta\ndata: ${JSON.stringify(p)}\n\n`)
  // done
  chunks.push(`event: done\ndata: "ok"\n\n`)

  const stream = Readable.from(chunks)
  event.node.res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  event.node.res.setHeader('Cache-Control', 'no-cache, no-transform')
  event.node.res.setHeader('X-Accel-Buffering', 'no')
  return sendStream(event, stream)
})
