// server/utils/retrieve.ts
import { db } from './db'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-large'

export type Retrieved = {
  chunk_id: string
  doc_id: string
  heading: string
  content: string
  source_url: string | null
  url_anchor: string | null
  score: number
}

export async function embedQuery(q: string) {
  const r = await openai.embeddings.create({ model: EMBED_MODEL, input: q })
  return r.data[0].embedding
}

export async function semanticSearch(query: string, k = 8): Promise<Retrieved[]> {
  const e = await embedQuery(query)
  const client = db()
  await client.connect()
  const res = await client.query(
    `SELECT chunk_id, doc_id, heading, content, source_url, url_anchor,
            1 - (embedding <=> $1::vector) AS score
     FROM rag_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2;`,
    [e, k]
  )
  await client.end()
  return res.rows
}
