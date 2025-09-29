import pool from './db'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const EMB_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large'
const TOP_K = Number(process.env.RAG_TOP_K ?? 6)

export async function searchChunks(query: string, topK = TOP_K) {
  const emb = await openai.embeddings.create({ model: EMB_MODEL, input: query })
  const v = emb.data[0].embedding
  const sql = `
    SELECT doc_id, chunk_id, heading, content, source_url,
           1 - (embedding <=> $1::vector) AS score
    FROM rag_chunks
    ORDER BY embedding <=> $1::vector
    LIMIT $2`
  const { rows } = await pool.query(sql, [v, topK])
  return rows
}
