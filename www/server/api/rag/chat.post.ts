// www/server/api/rag/chat.post.ts
import { answerRag, searchRag } from '~/utils/rag'

function expandQuery(q: string) {
  // add light-weight synonyms/related terms; adjust to your domain
  return [
    q,
    `${q} internationalization i18n localization multi-country multi region`,
    `${q} configuration setup steps`,
    `${q} example sample code`,
  ]
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ question: string; k?: number; history?: any[] }>(event)
  const question = (body?.question || '').trim()
  const k = Number(body?.k ?? 8) || 8

  if (!question) {
    setResponseStatus(event, 400)
    return { error: 'question required' }
  }

  // 1) initial retrieval
  let items = await searchRag(question, k)

  // 2) if thin or empty, try expanded queries w/ higher k and pick the best
  if (!items.length || items.length < Math.min(5, k)) {
    const alts = expandQuery(question)
    const retries = await Promise.all(alts.map(qx => searchRag(qx, Math.max(20, k))))
    // choose the list with most items; if tied, prefer the one with the highest avg score
    const scored = retries.map((arr) => ({
      arr,
      count: arr.length,
      avg: arr.length ? arr.reduce((s, r) => s + (r.score ?? 0), 0) / arr.length : 0,
    }))
    scored.sort((a, b) => b.count - a.count || b.avg - a.avg)
    if (scored[0]?.arr?.length) items = scored[0].arr
  }

  const { answer, sources } = await answerRag(question, k, body?.history)
  return { answer, sources: sources.length ? sources : items.slice(0, k) }
})




