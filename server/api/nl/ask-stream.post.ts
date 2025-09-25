// server/api/nl/ask-stream.post.ts
import { defineEventHandler, readBody, setHeader, sendStream, createError } from 'h3'
import { PassThrough } from 'node:stream'
import OpenAI from 'openai'
import { embedOne, searchTopK } from '../../nlweb/llm'     // you already have these
import type { EmbeddingRow } from '../../nlweb/types'
import { useRuntimeConfig } from '#imports'
import fs from 'node:fs'

// tiny util: write one SSE event
function sse(pt: PassThrough, event: string, data: any) {
  pt.write(`event: ${event}\n`)
  pt.write(`data: ${typeof data === 'string' ? data : JSON.stringify(data)}\n\n`)
}

export default defineEventHandler(async (event) => {
  const { query, k = 8 } = await readBody<{ query: string; k?: number }>(event) || {}
  if (!query?.trim()) throw createError({ statusCode: 400, statusMessage: 'Missing "query"' })

  const cfg = useRuntimeConfig()
  const openai = new OpenAI({ apiKey: cfg.openaiApiKey })
  const model = cfg.openaiModel || 'gpt-4o-mini'

  // Load the embeddings index you built (same file your non-stream path uses)
  const rows: EmbeddingRow[] = JSON.parse(fs.readFileSync('.data/nlweb-embeddings.json', 'utf8'))

  // Retrieval
  const qVec = await embedOne({ apiKey: cfg.openaiApiKey, model: cfg.embedModel, text: query })
  const hits = searchTopK(qVec, rows, k)

  const context = hits.map((h, i) => `[${i + 1}] ${h.meta.text}`).join('\n\n')
  const citations = hits.map((h, i) => ({
    '@type': 'CreativeWork',
    url: h.meta.url,
    name: h.meta.title || h.meta.url || `Source ${i + 1}`
  }))

  // Prepare SSE stream
  const pt = new PassThrough()
  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-store')
  setHeader(event, 'Connection', 'keep-alive')
  // Send "sources" immediately so the UI can render the Top Sources panel
  sse(pt, 'sources', citations)

  // Build messages
  const system = `You are a strict documentation assistant.
- Answer ONLY from the provided context snippets.
- Prefer concise markdown.
- Include citations by referencing the bracketed numbers where appropriate.`
  const user = `User question:
${query}

Context snippets:
${context}`

  // Start streaming
  ;(async () => {
    try {
      const stream = await openai.chat.completions.create({
        model,
        stream: true,
        temperature: 0.2,
        response_format: { type: 'text' }, // content as text chunks
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta?.content
        if (delta) sse(pt, 'delta', delta)
      }

      // done: send citations once more for convenience, then close
      sse(pt, 'done', { citations })
      pt.end()
    } catch (e: any) {
      sse(pt, 'error', e?.message || 'Stream failed')
      pt.end()
    }
  })()

  return sendStream(event, pt)
})
