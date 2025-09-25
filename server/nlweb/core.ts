import { loadIndex } from './index'
import { embedOne, searchTopK, synthesizeAnswer } from './llm'

function keywordFilter(query: string, rows: any[], limit = 12) {
  const q = query.toLowerCase()
  const terms = q.split(/\s+/).filter(Boolean)
  const scored = rows.map((r) => {
    const { title = '', description = '', text = '' } = r.meta || {}
    const hay = `${title}\n${description}\n${text}`.toLowerCase()
    const s = terms.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0)
    return { r, s }
  }).filter(x => x.s > 0)
  scored.sort((a, b) => b.s - a.s)
  return scored.slice(0, limit).map(x => x.r)
}

export async function handleAsk({
  query, mode = 'generate', k = 8
}: { query: string; mode?: 'generate'|'list'|'summarize'; k?: number }) {
  const rows = await loadIndex()
  if (!rows.length) return { "@type": "ItemList", "itemListElement": [] }

  const apiKey = useRuntimeConfig().openaiApiKey as string
  const embedModel = useRuntimeConfig().embedModel as string

  // vector retrieve
  let hits: any[] = []
  try {
    const qvec = await embedOne({ apiKey, model: embedModel, text: query })
    hits = searchTopK(qvec, rows, mode === 'list' ? 12 : (k ?? 8))
  } catch {
    // if embeddings fail, we’ll fall back to keywords below
  }

  // fallback to keyword match if vector returns nothing
  if (!hits.length) {
    hits = keywordFilter(query, rows, mode === 'list' ? 12 : 8)
  }

  // list mode: always return ItemList
  if (mode === 'list') {
    return {
      "@type": "ItemList",
      "itemListElement": hits.map((h: any, i: number) => ({
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

  // if still nothing, return a helpful message
  if (!hits.length) {
    const total = rows.length
    return {
      "@type": "Answer",
      text: `I couldn’t find anything for “${query}” in the current index.\n\nThe index has ${total} chunk${total === 1 ? '' : 's'}. Try a different query or expand your docs.`,
      citation: []
    }
  }

  // grounded synthesis
  const llmModel = useRuntimeConfig().openaiModel as string
  return await synthesizeAnswer({ apiKey, model: llmModel, query, hits })
}

