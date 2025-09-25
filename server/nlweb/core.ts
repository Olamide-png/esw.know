import { loadIndex } from './index'
import { embedOne, searchTopK, synthesizeAnswer } from './llm'

export async function handleAsk({
  query, mode = 'generate', k = 8
}: { query: string; mode?: 'generate'|'list'|'summarize'; k?: number }) {
  const rows = await loadIndex()
  if (!rows.length) {
    return { "@type": "ItemList", "itemListElement": [] }
  }

  // 1) embed query
  const apiKey = useRuntimeConfig().openaiApiKey as string
  const embedModel = useRuntimeConfig().embedModel as string
  const qvec = await embedOne({ apiKey, model: embedModel, text: query })

  // 2) retrieve
  const hits = searchTopK(qvec, rows, mode === 'list' ? 12 : 8)

  // 3) list mode returns an ItemList
  if (mode === 'list') {
    return {
      "@type": "ItemList",
      "itemListElement": hits.map((h, i) => ({
        position: i + 1,
        item: {
          "@type": h.meta.type || "Article",
          name: h.meta.title,
          description: (h.meta.text || '').slice(0, 400),
          url: h.meta.url,
          image: h.meta.image
        }
      }))
    }
  }

  // 4) grounded synthesis via LLM
  const llmModel = useRuntimeConfig().openaiModel as string
  const answer = await synthesizeAnswer({
    apiKey,
    model: llmModel,
    query,
    hits
  })
  return answer
}
