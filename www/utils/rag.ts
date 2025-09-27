// www/utils/rag.ts
import 'pgvector/pg'            // registers pgvector with pg
import { toSql } from 'pgvector/pg'
import { Pool } from 'pg'
import OpenAI from 'openai'

/**
 * ---------------------------
 * Config (env or defaults)
 * ---------------------------
 */
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'
const EMBED_MODEL  = process.env.EMBED_MODEL  || 'text-embedding-3-small' // 1536 dims
const RERANK_MODEL = process.env.RERANK_MODEL || '' // e.g. 'gpt-4o-mini' (optional)
const USE_HYDE     = (process.env.RAG_USE_HYDE ?? 'true') === 'true'
const USE_RERANK   = (process.env.RAG_USE_RERANK ?? 'false') === 'true' && !!RERANK_MODEL

const BROADEN_TERMS = process.env.RAG_BROADEN_TERMS ||
  'internationalization i18n localization multi-country multi region config configuration setup example sample code'

const POOL = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10
})

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * ---------------------------
 * Types
 * ---------------------------
 */
export type RagRow = {
  doc_id: string
  chunk_id: string
  heading: string
  content: string
  source_url: string | null
  url_anchor: string | null
  title: string
  score: number
}

export type RagItem = {
  id: string
  doc_id: string
  heading: string
  title: string
  excerpt: string
  url: string | null
  score: number
}

/**
 * ---------------------------
 * Helpers
 * ---------------------------
 */
function softmaxNorm(values: number[]) {
  if (!values.length) return values
  const max = Math.max(...values)
  const exps = values.map(v => Math.exp(v - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map(v => v / (sum || 1))
}

/** Reciprocal Rank Fusion (simple & robust). */
function rrf(...lists: RagRow[][]): RagRow[] {
  const K = 60
  const map = new Map<string, RagRow & { _rrf: number }>()
  lists.forEach(list => {
    list.forEach((row, idx) => {
      const key = row.chunk_id
      const current = map.get(key)
      const add = 1 / (K + idx + 1)
      if (!current) map.set(key, { ...row, _rrf: add })
      else current._rrf += add
    })
  })
  return Array.from(map.values()).sort((a, b) => b._rrf - a._rrf)
}

/** Simple MMR-ish diversification by doc_id. Keep top N per doc in final list. */
function diversifyByDoc(rows: RagRow[], perDoc = 3) {
  const keep: RagRow[] = []
  const per = new Map<string, number>()
  for (const r of rows) {
    const n = per.get(r.doc_id) || 0
    if (n < perDoc) {
      keep.push(r)
      per.set(r.doc_id, n + 1)
    }
  }
  return keep
}

function cleanExcerpt(s?: string, len = 600) {
  if (!s) return ''
  const t = s.replace(/\s+/g, ' ').trim()
  return t.length > len ? t.slice(0, len - 1) + '…' : t
}

function stableUrl(source_url?: string | null, anchor?: string | null) {
  if (!source_url) return null
  const a = anchor?.startsWith('#') ? anchor : anchor ? `#${anchor}` : ''
  return `${source_url}${a}`
}

/** Batch embeddings. */
async function embed(texts: string[]): Promise<number[][]> {
  if (!texts.length) return []
  const res = await openai.embeddings.create({
    model: EMBED_MODEL,
    input: texts
  })
  return res.data.map(d => d.embedding as unknown as number[])
}

/** HYDE prompt -> short pseudo-doc. */
async function hyde(query: string): Promise<string> {
  const sys =
    'Generate a short, neutral paragraph that would likely appear in documentation answering the user question.'
  const r = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.3,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Question: ${query}\nWrite 2-3 sentences.` }
    ]
  })
  return r.choices?.[0]?.message?.content?.trim() || ''
}

/** Optional LLM reranker on the topN. Returns new order (descending). */
async function rerankLLM(query: string, items: RagRow[]): Promise<RagRow[]> {
  if (!USE_RERANK || !items.length) return items
  const top = items.slice(0, Math.min(20, items.length))
  const numbered = top.map((x, i) => `[#${i + 1}] ${x.title} > ${x.heading}\n${cleanExcerpt(x.content, 800)}`).join('\n\n')
  const sys = 'You are a ranking model. Return a comma-separated list of the item numbers in best-to-worst order.'
  const prompt = `Query: ${query}\n\nItems:\n${numbered}\n\nReturn only numbers like: "1,5,2,..."`

  const r = await openai.chat.completions.create({
    model: RERANK_MODEL,
    temperature: 0.0,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: prompt }
    ]
  })
  const text = r.choices?.[0]?.message?.content || ''
  const order = text.match(/\d+/g)?.map(n => parseInt(n, 10)) || []
  const byIdx = (i: number) => top[i - 1]?.chunk_id
  const idOrder = order.map(byIdx).filter(Boolean)
  const mapped = new Map(top.map(x => [x.chunk_id, x]))
  const reranked = idOrder.map(id => mapped.get(id)!).filter(Boolean)
  const rest = top.filter(x => !idOrder.includes(x.chunk_id))
  const final = [...reranked, ...rest]
  return [...final, ...items.slice(top.length)]
}

/**
 * ---------------------------
 * searchRag (HYBRID)
 * ---------------------------
 *
 * - vector (query + HYDE) with pgvector param fix (toSql)
 * - keyword (tsvector + trigram)
 * - broaden if thin
 * - RRF fusion + doc diversity
 */
export async function searchRag(query: string, k = 8): Promise<RagItem[]> {
  const client = await POOL.connect()
  try {
    // Embeddings for query (and HYDE if enabled)
    const hydeText = USE_HYDE ? await hyde(query) : ''
    const toEmbed = [query, hydeText].filter(Boolean)
    const [qVec, hyVec] = (await embed(toEmbed)).concat([undefined, undefined]).slice(0, 2)

    // --- VECTOR: original query (use toSql(qVec))
    const vecRows: RagRow[] = qVec
      ? (await client.query<RagRow>(
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
          [toSql(qVec), Math.max(k * 4, 32)]
        )).rows
      : []

    // --- VECTOR: HYDE (use toSql(hyVec))
    const hyRows: RagRow[] = hyVec
      ? (await client.query<RagRow>(
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
          [toSql(hyVec), Math.max(k * 4, 32)]
        )).rows
      : []

    // --- KEYWORD: BM25-ish + trigram
    const kwRows: RagRow[] = (await client.query<RagRow>(
      `
      WITH q AS (
        SELECT plainto_tsquery('english', $1) AS tsq, $1::text AS raw
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
          + greatest(similarity(c.heading, q.raw), similarity(c.content, q.raw)) * 0.5
        ) AS score
      FROM rag_chunks c
      LEFT JOIN rag_documents d ON d.doc_id = c.doc_id,
      q
      WHERE c.tsv @@ q.tsq
         OR similarity(c.heading, q.raw) > 0.15
         OR similarity(c.content, q.raw) > 0.15
      ORDER BY score DESC
      LIMIT $2
      `,
      [query, Math.max(k * 4, 32)]
    )).rows

    // If thin, broaden with synonyms and larger k
    let allLists = [vecRows, hyRows, kwRows]
    const total = vecRows.length + hyRows.length + kwRows.length
    if (total < Math.min(5, k)) {
      const broadenQ = `${query} ${BROADEN_TERMS}`
      const more: RagRow[] = (await client.query<RagRow>(
        `
        WITH q AS ( SELECT plainto_tsquery('english', $1) AS tsq, $1::text AS raw )
        SELECT c.doc_id, c.chunk_id, c.heading, c.content, c.source_url, c.url_anchor,
               COALESCE(d.title, c.heading) AS title,
               ( ts_rank(c.tsv, q.tsq) * 1.0
                 + greatest(similarity(c.heading, q.raw), similarity(c.content, q.raw)) * 0.5 ) AS score
        FROM rag_chunks c
        LEFT JOIN rag_documents d ON d.doc_id = c.doc_id, q
        WHERE c.tsv @@ q.tsq
           OR similarity(c.heading, q.raw) > 0.12
           OR similarity(c.content, q.raw) > 0.12
        ORDER BY score DESC
        LIMIT $2
        `,
        [broadenQ, Math.max(k * 5, 40)]
      )).rows
      allLists = [vecRows, hyRows, kwRows, more]
    }

    // Optional rerank topN (LLM) to polish the head
    if (USE_RERANK) {
      const flat = [...vecRows, ...hyRows, ...kwRows]
      const reranked = await rerankLLM(query, flat)
      allLists = [reranked]
    }

    // Fuse + diversify
    const fused = diversifyByDoc(rrf(...allLists), 3).slice(0, Math.max(k * 2, 20))

    // Normalize scores for UI
    const norm = softmaxNorm(fused.map(r => r.score ?? 0))
    const shaped: RagItem[] = fused.map((r, i) => ({
      id: r.chunk_id,
      doc_id: r.doc_id,
      heading: r.heading,
      title: r.title || r.heading || 'Untitled',
      excerpt: cleanExcerpt(r.content),
      url: stableUrl(r.source_url, r.url_anchor),
      score: norm[i]
    }))

    return shaped.slice(0, k)
  } finally {
    client.release()
  }
}

/**
 * ---------------------------
 * answerRag
 * ---------------------------
 * Uses retrieved items as context; returns a short, cited answer.
 */
export async function answerRag(question: string, k = 8, history: any[] = []) {
  const items = await searchRag(question, k)
  const ctx = items
    .map((s, i) => `[#${i + 1}] ${s.title} > ${s.heading}\n${s.excerpt}\n${s.url ?? ''}`)
    .join('\n\n')

  const sys =
    'You are a concise, accurate assistant grounded in the supplied docs.\n' +
    'Only answer using the provided context. Use inline citations like [#n] that refer to the sources list.'

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: sys },
    ...(history || []).slice(-6),
    { role: 'user', content: `Question: ${question}\n\nContext:\n${ctx}` }
  ]

  const r = await openai.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.2,
    messages
  })

  const answer = r.choices?.[0]?.message?.content?.trim() || ''
  const sources = items.map((s, i) => ({ id: i + 1, title: `${s.title} > ${s.heading}`, url: s.url, score: s.score }))

  return { answer, sources }
}






