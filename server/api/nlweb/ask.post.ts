// server/api/ask.post.ts
import { z } from 'zod'
import { serverQueryContent } from '#content/server'

const Body = z.object({
  query: z.string().min(1, 'query is required'),
  limit: z.number().int().min(1).max(20).optional(),
  lang: z.string().optional()
})

/**
 * Super light retrieval:
 * - fetches all _partial entries (sections) so we can grab smaller chunks
 * - scores by simple term overlap (no new deps / embeddings)
 * - returns top N with a short snippet and path for citation
 */
async function retrieveFromDocs(event: any, q: string, k: number) {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  const entries = await serverQueryContent(event).where({ _partial: true }).find()

  type Hit = {
    _path?: string
    title?: string
    description?: string
    bodyText?: string
    _id?: string
    score: number
    snippet: string
  }

  const hits: Hit[] = entries.map((doc) => {
    const text = [
      doc.title || '',
      doc.description || '',
      (doc.bodyText as string) || '',
      doc._path || ''
    ].join('\n').toLowerCase()

    const score =
      (text.includes(q.toLowerCase()) ? 3 : 0) +
      terms.reduce((s, t) => s + (text.includes(t) ? 1 : 0), 0)

    // pick a short snippet for the prompt
    const body = (doc.bodyText as string) || ''
    const idx = Math.max(0, body.toLowerCase().indexOf(terms[0] || '') - 80)
    const snippet = body.slice(idx, idx + 700)

    return {
      ...doc,
      score,
      snippet
    }
  })
  .filter(h => h.score > 0)
  .sort((a, b) => b.score - a.score)
  .slice(0, k)

  return hits
}

export default defineEventHandler(async (event) => {
  const body = Body.parse(await readBody(event))
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

  if (!OPENAI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })
  }

  // 1) retrieve relevant doc chunks
  const k = body.limit ?? 6
  const hits = await retrieveFromDocs(event, body.query, k)

  // 2) build context for the LLM
  const contextBlocks = hits.map((h, i) => {
    const header = `[[${i + 1}]] ${h.title || h._path || 'Untitled'} — ${h._path ?? ''}`
    return `${header}\n${h.snippet}`
  }).join('\n\n---\n\n')

  const system = [
    'You are a helpful docs assistant.',
    'Answer ONLY using the provided CONTEXT. If the answer is not in context, say you do not know.',
    'Keep answers concise and cite sources like [1], [2] that refer to the items in CONTEXT.',
  ].join(' ')

  const user = [
    `QUESTION: ${body.query}`,
    '',
    'CONTEXT:',
    contextBlocks || '(no context found)'
  ].join('\n')

  // 3) call OpenAI without adding a new SDK dependency
  const resp = await $fetch<any>('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: {
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.2
    }
  })

  const answer = resp?.choices?.[0]?.message?.content?.trim() || 'Sorry, I could not produce an answer.'

  return {
    answer,
    sources: hits.map((h, i) => ({
      index: i + 1,
      title: h.title || h._path || 'Untitled',
      path: h._path || '',
      description: h.description || ''
    }))
  }
})






