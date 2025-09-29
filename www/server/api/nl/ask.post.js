import { defineEventHandler, readBody } from 'h3'
import pg from 'pg'
import OpenAI from 'openai'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small' // 1536-dim
const MAX_CHARS = Number(process.env.RAG_MAX_CHARS || 12000)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const question = body?.question
  const scopePath = body?.path
  const k = Math.min(20, Number(body?.k || 12))

  if (!question || typeof question !== 'string') {
    event.node.res.statusCode = 400
    return { ok: false, error: 'question is required' }
  }

  // 1) Embed the query
  const emb = await openai.embeddings.create({ model: EMBED_MODEL, input: question })
  const qvec = emb.data[0].embedding

  const client = await pool.connect()
  try {
    // Encourage ANN index usage; (no ivfflat.probes needed for HNSW)
    await client.query('SET enable_seqscan = off')

    const scope = scopePath ? `${scopePath}%` : null

    // 2) Hybrid rank-fusion search via DB function
    const { rows } = await client.query(
      'SELECT * FROM rag_hybrid_search($1::vector, $2::text, $3::int, $4::text)',
      [qvec, question, k, scope]
    )

    // 3) Build grounded context under a char budget
    let used = 0
    const ctx = []
    for (const r of rows) {
      const block = `### ${r.heading || 'Context'}\n${r.content}`.trim()
      if (used + block.length > MAX_CHARS) break
      ctx.push(block)
      used += block.length
    }

    // 4) Answer with citations
    const messages = [
      { role: 'system', content: 'Answer strictly from the provided context. If it is not present, say you do not know and suggest the closest relevant docs.' },
      { role: 'user', content: `Question: ${question}\n\nContext:\n${ctx.join('\n\n')}` }
    ]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.2
    })

    return {
      ok: true,
      answer: completion.choices[0]?.message?.content || '',
      sources: rows.slice(0, 8).map(r => ({ doc_id: r.doc_id, heading: r.heading }))
    }
  } finally {
    client.release()
  }
})






