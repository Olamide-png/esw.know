// www/server/api/rag/chat.stream.get.ts
import { searchRag } from '~/utils/rag'
import OpenAI from 'openai'

function expandQuery(q: string) {
  return [
    q,
    `${q} internationalization i18n localization multi-country multi region`,
    `${q} configuration setup steps`,
    `${q} example sample code`,
  ]
}

export default defineEventHandler(async (event) => {
  const { q, k } = getQuery(event) as { q?: string; k?: string }
  const question = (q || '').toString().trim()
  const topK = Number(k ?? 8) || 8
  if (!question) {
    setResponseStatus(event, 400)
    return 'question required'
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  // SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')

  const push = (payload: any) => {
    event.node.res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }

  // initial retrieval
  let items = await searchRag(question, topK)

  // retry with broader terms if too thin
  if (!items.length || items.length < Math.min(5, topK)) {
    // UI hint: tell the client we're widening the search
    push({ type: 'status', text: 'broadening search…' })

    const alts = expandQuery(question)
    const results = await Promise.all(alts.map(qx => searchRag(qx, Math.max(20, topK))))
    const scored = results.map((arr) => ({
      arr,
      count: arr.length,
      avg: arr.length ? arr.reduce((s, r) => s + (r.score ?? 0), 0) / arr.length : 0,
    }))
    scored.sort((a, b) => b.count - a.count || b.avg - a.avg)
    if (scored[0]?.arr?.length) items = scored[0].arr

    // optional: clear the status (client will hide it on 'done' anyway)
    push({ type: 'status', text: '' })
  }

  // send sources first so UI can draw the right pane
  const sources = items.slice(0, topK).map((it, i) => ({
    id: i + 1,
    title: `${it.title} > ${it.heading}`,
    url: it.url,
    score: it.score,
  }))
  push({ type: 'sources', sources })

  // build context
  const ctx = sources.map((s, i) => {
    const it = items[i]
    return `[#${i + 1}] ${s.title}\n${it?.excerpt ?? ''}\n${s.url ?? ''}`
  }).join('\n\n')

  const sys =
    'You are a concise technical assistant for these docs. ' +
    'Use the provided context; cite inline like [#n]. ' +
    'Prefer concrete steps and exact terms from the docs. ' +
    'If still unclear, say what’s missing and point to the most relevant source.'

  const stream = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    temperature: 0.2,
    stream: true,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Question: ${question}\n\nContext:\n${ctx}` },
    ],
  })

  for await (const chunk of stream) {
    const delta = chunk?.choices?.[0]?.delta?.content
    if (delta) push({ type: 'delta', delta })
  }

  push({ type: 'done' })
  event.node.res.end()
})


