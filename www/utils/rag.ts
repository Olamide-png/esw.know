// www/utils/rag.ts
import OpenAI from 'openai'
import { Client } from 'pg'
import { toSql } from 'pgvector/pg'

/**
 * Env
 */
const DATABASE_URL = process.env.DATABASE_URL!
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small' // 1536 dims
const RAG_USE_HYDE = (process.env.RAG_USE_HYDE || 'true').toLowerCase() !== 'false'

// Optional rerank (kept off by default to minimize tokens/latency)
const RAG_USE_RERANK = (process.env.RAG_USE_RERANK || 'false').toLowerCase() === 'true'

if (!DATABASE_URL) throw new Error('DATABASE_URL missing')
if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY missing')

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

/**
 * PG client helper
 */
function pgClient() {
  return new Client({ connectionString: DATABASE_URL })
}

/**
 * Embed helper
 */
async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: text,
  })
  return (res.data[0].embedding as unknown) as number[]
}

/**
 * Tiny RRF (reciprocal-rank fusion)
 * Combine lists and keep top N by fused score
 */
function rrf<T extends { id: string | number }>(k: number, ...lists: T[][]) {
  const scores = new Map<string | number, number>()
  const seen = new Map<string | number, T>()
  const K = 60 // smoothing constant

  for (const list of lists) {
    list.forEach((item, idx) => {
      const add = 1 / (K + idx + 1)
      scores.set(item.id, (scores.get(item.id) || 0) + add)
      if (!seen.has(item.id)) seen.set(item.id, item)
    })
  }
  return Array.from(seen.values()).sort((a, b) => (scores.get(b.id)! - scores.get(a.id)!))
    .slice(0, k)
}

/**
 * Shape a DB row into a result item
 */
function asItem(r: any) {
  return {
    id: r.chunk_id,
    doc_id: r.doc_id,
    heading: r.heading,
    title: r.title || r.heading || 'Untitled',
    excerpt: (r.content || '').slice(0, 500),
    url: r.source_url ?? null,
    score: typeof r.score === 'number' ? r.score : null,
  }
}

export type SearchItem = ReturnType<typeof asItem>

/**
 * Core retriever: vector + (optional) HYDE + BM25/trigram keyword
 */
export async function searchRag(query: string, k = 8): Promise<{ items: SearchItem[] }> {
  const pg = pgClient()
  await pg.connect()

  try {
    // Embed user query
    const vec = await embed(query)
    const vecParam = toSql(vec) // ✅ serialize for pgvector

    // Optional HYDE (hypothetical answer)
    let hyParam: any = null
    if (RAG_USE_HYDE) {
      try {
        const hy = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [
            { role: 'system', content: 'Write a concise paragraph that would likely answer the user’s question.' },
            { role: 'user', content: query }
          ],
          temperature: 0.2,
          max_tokens: 180
        })
        const hyText = hy.choices[0]?.message?.content?.trim() || ''
        if (hyText) {
          const hyVec = await embed(hyText)
          hyParam = toSql(hyVec) // ✅
        }
      } catch {
        hyParam = null
      }
    }

    // --- Vector search (query)
    const vecRows = await pg.query(
      `
      SELECT
        c.doc_id,
        c.chunk_id,
        c.heading,
        c.content,
        c.source_url,
        c.url_anchor,
        COALESCE(d.title, c.heading) AS title,
        1 - (c.embedding <=> $1::vector) AS score
      FROM rag_chunks c
      LEFT JOIN rag_documents d ON d.doc_id = c.doc_id
      ORDER BY c.embedding <=> $1::vector
      LIMIT $2
      `,
      [vecParam, Math.max(k * 4, 32)]
    )

    // --- Vector search (HYDE)
    const hyRows = hyParam
      ? await pg.query(
          `
          SELECT
            c.doc_id,
            c.chunk_id,
            c.heading,
            c.content,
            c.source_url,
            c.url_anchor,
            COALESCE(d.title, c.heading) AS title,
            1 - (c.embedding <=> $1::vector) AS score
          FROM rag_chunks c
          LEFT JOIN rag_documents d ON d.doc_id = c.doc_id
          ORDER BY c.embedding <=> $1::vector
          LIMIT $2
          `,
          [hyParam, Math.max(k * 4, 32)]
        )
      : { rows: [] }

    // --- Keyword (BM25-ish + trigram)
    const kwRows = await pg.query(
      `
      WITH q AS (
        SELECT websearch_to_tsquery('english', $1) AS tsq, $1::text AS raw
      )
      SELECT
        c.doc_id,
        c.chunk_id,
        c.heading,
        c.content,
        c.source_url,
        c.url_anchor,
        COALESCE(d.title, c.heading) AS title,
        (
          ts_rank(c.tsv, q.tsq) * 1.0
          + GREATEST(similarity(c.heading, q.raw), similarity(c.content, q.raw)) * 0.5
        ) AS score
      FROM rag_chunks c
      LEFT JOIN rag_documents d ON d.doc_id = c.doc_id,
      q
      WHERE c.tsv @@ q.tsq
         OR similarity(c.heading, q.raw) > 0.10
         OR similarity(c.content, q.raw) > 0.10
      ORDER BY score DESC
      LIMIT $2
      `,
      [query, Math.max(k * 4, 32)]
    )

    // Fuse and shape
    const fused = rrf<SearchItem>(k,
      vecRows.rows.map(asItem),
      hyRows.rows.map(asItem),
      kwRows.rows.map(asItem),
    )

    // If nothing, broaden (synonyms + bigger K)
    if (!fused.length) {
      const broaden = `${query} internationalization i18n localization multi-country multi-market`
      const vec2 = await embed(broaden)
      const vecParam2 = toSql(vec2)

      const alt = await pg.query(
        `
        SELECT
          c.doc_id,
          c.chunk_id,
          c.heading,
          c.content,
          c.source_url,
          c.url_anchor,
          COALESCE(d.title, c.heading) AS title,
          1 - (c.embedding <=> $1::vector) AS score
        FROM rag_chunks c
        LEFT JOIN rag_documents d ON d.doc_id = c.doc_id
        ORDER BY c.embedding <=> $1::vector
        LIMIT $2
        `,
        [vecParam2, Math.max(k * 6, 48)]
      )

      return { items: alt.rows.map(asItem).slice(0, k) }
    }

    return { items: fused.slice(0, k) }
  } finally {
    await pg.end()
  }
}

/**
 * Generate an answer using retrieved context.
 * Returns { answer, sources }.
 */
export async function answerRag(
  question: string,
  k = 8,
): Promise<{ answer: string; sources: SearchItem[] }> {
  const { items } = await searchRag(question, k)

  if (!items.length) {
    return {
      answer:
        'I could not find a specific answer in the docs. Try rephrasing or providing more detail.',
      sources: [],
    }
  }

  // Compose context with lightweight citations [#1], [#2], …
  const top = items.slice(0, k)
  const context = top
    .map((it, i) => `[#${i + 1}] ${it.title}\n${it.excerpt}\n${it.url ?? ''}`)
    .join('\n\n---\n\n')

  const sys =
    'You are a helpful documentation assistant. Answer the question using only the provided context. Use short, direct sentences. Use bracket citations like [#1], [#2] that match the sources list. If you are unsure, say so.'

  const user = `Question: ${question}\n\nContext:\n${context}`

  const chat = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: user },
    ],
    temperature: 0.1,
    max_tokens: 400,
  })

  const answer = chat.choices[0]?.message?.content?.trim() || ''
  const sources = top.map(s => ({
    id: s.id,
    title: s.title,
    url: s.url,
    score: s.score,
  }))

  return { answer, sources }
}








