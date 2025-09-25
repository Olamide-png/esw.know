// server/nlweb/llm.ts
import OpenAI from 'openai'
import { cosine } from './utils'
import type { EmbeddingRow } from './types'

let client: OpenAI | null = null
function getClient(apiKey?: string) {
  if (!client) client = new OpenAI({ apiKey })
  return client
}

// ----- NEW: batched embeddings with retry/backoff -----
const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

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
    // retry on transient errors (429/5xx)
    for (;;) {
      try {
        const { data } = await openai.embeddings.create({ model, input: batch })
        for (const d of data) out.push(d.embedding as unknown as number[])
        break
      } catch (err: any) {
        attempt++
        if (attempt >= 5) throw err
        // exponential backoff: 0.5s, 1s, 2s, 4s (cap 4s)
        const delay = Math.min(4000, 500 * 2 ** (attempt - 1))
        await sleep(delay)
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
          if (v && typeof v === 'object') return v // already a CW-like object
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

  const context = hits.map((h, i) => `[${i + 1}] ${h.meta.text}`).join('\n\n')
  const defaultCitations = hits.map((h, i) => ({
    '@type': 'CreativeWork',
    url: h.meta.url,
    name: h.meta.title || h.meta.url || `Source ${i + 1}`
  }))

  const system = `You are a strict documentation assistant.
- Answer ONLY from the provided context snippets.
- If the context is insufficient, return an ItemList of the most relevant items (with url and name).
- Prefer concise markdown for the Answer.text.
- Always include citations; you may reference snippets by their bracketed numbers.`
  const user = `User question:
${query}

Context snippets:
${context}

Return a SINGLE JSON object with one of:
- {"@type":"Answer","text":"...","citation":[...]}
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

  try {
    const raw = resp.choices[0]?.message?.content || '{}'
    let json = JSON.parse(raw)

    if (json?.['@type'] === 'Answer') {
      if (!json.citation || !Array.isArray(json.citation) || json.citation.length === 0) {
        json.citation = defaultCitations
      }
      json = normalizeCitations(json, hits)
      return json
    }

    if (json?.['@type'] === 'ItemList') return json
  } catch {
    // fall through to deterministic fallback
  }

  return {
    '@type': 'ItemList',
    'itemListElement': hits.map((h, i) => ({
      position: i + 1,
      item: {
        '@type': h.meta.type || 'Article',
        name: h.meta.title,
        description: (h.meta.text || '').slice(0, 400),
        url: h.meta.url,
        image: h.meta.image
      }
    }))
  }
}


