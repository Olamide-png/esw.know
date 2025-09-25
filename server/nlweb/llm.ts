import OpenAI from 'openai'
import { cosine } from './utils'
import type { EmbeddingRow, Chunk } from './types'

let client: OpenAI | null = null
function getClient(apiKey?: string) {
  if (!client) client = new OpenAI({ apiKey })
  return client
}

export async function embedMany({
  apiKey, model, texts
}: { apiKey: string, model: string, texts: string[] }): Promise<number[][]> {
  const openai = getClient(apiKey)
  const { data } = await openai.embeddings.create({ model, input: texts })
  return data.map(d => d.embedding as unknown as number[])
}

export async function embedOne({
  apiKey, model, text
}: { apiKey: string, model: string, text: string }): Promise<number[]> {
  const [v] = await embedMany({ apiKey, model, texts: [text] })
  return v
}

export function searchTopK(queryVec: number[], rows: EmbeddingRow[], k = 8): EmbeddingRow[] {
  const scored = rows.map(r => ({ r, s: cosine(queryVec, r.vector) }))
  scored.sort((a, b) => b.s - a.s)
  return scored.slice(0, k).map(x => x.r)
}

export async function synthesizeAnswer({
  apiKey, model, query, hits
}: { apiKey: string, model: string, query: string, hits: EmbeddingRow[] }): Promise<any> {
  const openai = getClient(apiKey)
  const context = hits.map((h, i) => `[${i+1}] ${h.meta.text}`).join('\n\n')
  const citations = hits.map((h, i) => ({
    "@type": "CreativeWork",
    url: h.meta.url, name: h.meta.title || h.meta.url || `Source ${i+1}`
  }))

  const system = `You are a strict documentation assistant.
- Only answer from context.
- If insufficient, return an ItemList of the most relevant items (with url/name).
- Prefer concise markdown.
- Always include citations.`
  const user = `User question:\n${query}\n\nContext:\n${context}\n\nReturn JSON with one of:
- {"@type":"Answer","text":"...","citation":[...] }
- {"@type":"ItemList","itemListElement":[{"position":1,"item":{"@type":"Article","name":"...","description":"...","url":"...","image":"..."}}]}`

  const resp = await openai.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.2
  })

  // Fallback: if model fails, return a simple list
  try {
    const json = JSON.parse(resp.choices[0]?.message?.content || '{}')
    // ensure citations exist for Answer
    if (json?.['@type'] === 'Answer' && !json.citation) json.citation = citations
    return json
  } catch {
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
}
