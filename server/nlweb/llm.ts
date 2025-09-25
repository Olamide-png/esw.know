// server/nlweb/llm.ts
import OpenAI from 'openai'
import { cosine } from './utils'
import type { EmbeddingRow } from './types'

let client: OpenAI | null = null
function getClient(apiKey?: string) {
  if (!client) client = new OpenAI({ apiKey })
  return client
}

// --- utils ---
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

function safeParse(s: string) {
  if (!s) return null
  // strip ```json ... ``` just in case
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenced) s = fenced[1]
  try { return JSON.parse(s) } catch { return null }
}

function cleanSnippet(s: string, n = 400) {
  return (s || '')
    .replace(/<\/?[^>]+>/g, ' ')              // strip tags
    .replace(/&(?:nbsp|amp|lt|gt);/g, ' ')    // basic entities
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n)
}

/**
 * Create embeddings in batches to avoid token-per-request and rate-limit errors.
 * Tune batch size via EMBED_BATCH (default 128).
 */
export async function embedMany({
  apiKey,
  model,
  texts,
  batchSize = Number(process.env.EMBED_BATCH || 128)
}: {
  apiKey: string
  model: string
  texts: string[]
  batchSize?: number
}): Promise<number[][]> {
  const openai = getClient(apiKey)
  const out: number[][] = []

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize)
    let attempt = 0
    for (;;) {
      try {
        const { data } = await openai.embeddings.create({ model, input: batch })
        for (const d of data) out.push(d.embedding as unknown as number[])
        break
      } catch (err) {
        attempt++
        if (attempt >= 5) throw err
        await sleep(Math.min(4000, 500 * 2 ** (attempt - 1))) // 0.5s,1s,2s,4s
      }
    }
  }
  return out
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

/** Turn numbers like [1,2] (1-based) into CreativeWork citations based on hits. */
function normalizeCitations(json: any, hits: EmbeddingRow[]) {
  const toCW = (idx: number) => {
    const h = hits[idx - 1] // models usually 1-based
    if (!h) return null
    return {
      '@type': 'CreativeWork',
      url: h.meta.url,
      name: h.meta.title || h.meta.url || `Source ${idx}`
    }
  }

  if (json?.['@type'] === 'Answer') {
    const c = json.citation
    if (Array.isArray(c) && c.length) {
      const expanded = c
        .map((v) => {
          if (typeof v === 'number') return toCW(v)
          if (typeof v === 'string' && /^\d+$/.test(v)) return toCW(parseInt(v, 10))
          if (v && typeof v === 'object') return v
          return null
        })
        .filter(Boolean)

      if (expanded.length) {
        const seen = new Set<string>()
        json.citation = expanded.filter((cw: any) => {
          const key = cw.url || cw.name
          if (!key || seen.has(key)) return false
          seen.add(key)
          return true
        })
      }
    }
  }
  return json
}

export async function synthesizeAnswer({
  apiKey, model, query, hits
}: { apiKey: string, model: string, query: string, hits: EmbeddingRow[] }): Promise<any> {
  const openai = getClient(apiKey)

  // Use only the top 6 snippets in prompt to keep tokens tight
  const top = hits.slice(0, 6)
  const context = top.map((h, i) => `[${i + 1}] ${h.meta.text}`).join('\n\n')

  const defaultCitations = top.map((h, i) => ({
    '@type': 'CreativeWork',
    url: h.meta.url,
    name: h.meta.title || h.meta.url || `Source ${i + 1}`
  }))

  const system = `You are a strict documentation assistant.
- Use ONLY the provided context snippets.
- If the snippets clearly answer the question, return an "Answer".
- If the context is insufficient, return an "ItemList" of the most relevant items (with url and name).
- Answer text must be concise Markdown.
- Return a SINGLE JSON object, no code fences.`

  const user = `User question:
${query}

Context snippets:
${context}

Return one of exactly:
{"@type":"Answer","text":"...","citation":[...]}
OR
{"@type":"ItemList","itemListElement":[{"position":1,"item":{"@type":"Article","name":"...","description":"...","url":"...","image":"..."}}]}`

  const resp = await openai.chat.completions.create({
    model,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0
  })

  // Robust JSON parse with code-fence stripping
  try {
    const raw = resp.choices[0]?.message?.content || '{}'
    let json = safeParse(raw) ?? JSON.parse(raw)

    if (json?.['@type'] === 'Answer') {
      if (!json.citation || !Array.isArray(json.citation) || json.citation.length === 0) {
        json.citation = defaultCitations
      }
      json = normalizeCitations(json, top)
      return json
    }

    if (json?.['@type'] === 'ItemList') return json
  } catch {
    // fall through to deterministic fallback
  }

  // Deterministic fallback ItemList from hits
  return {
    '@type': 'ItemList',
    'itemListElement': hits.map((h, i) => ({
      position: i + 1,
      item: {
        '@type': h.meta.type || 'Article',
        name: h.meta.title,
        description: cleanSnippet(h.meta.text),
        url: h.meta.url,
        image: h.meta.image
      }
    }))
  }
}



