#!/usr/bin/env node
// RAG API v2 with improved scoring + confidence + previews.
// Endpoints:
//   GET        /api/ping
//   GET        /api/version
//   GET        /api/search2   q|query, k, path, method=lin|rrf|mix, alpha, rrfK, ef
//   GET|POST   /api/ask2      question, k, path, method, alpha, rrfK, ef
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { Pool } = require('pg')
const OpenAI = require('openai')

const PORT = Number(process.env.RAG_API_PORT || 4000)
const API_VERSION = '2'
const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-small' // 1536-dim
const MAX_CHARS = Number(process.env.RAG_MAX_CHARS || 12000)

if (!process.env.DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1) }
if (!process.env.OPENAI_API_KEY) { console.error('Missing OPENAI_API_KEY'); process.exit(1) }

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// ----- helpers -----
const vecLiteral = (arr) => `[${arr.map(n => (typeof n === 'number' ? n : Number(n))).join(',')}]`

function confidenceFromHits(hits = []) {
  if (!hits.length) return { level: 'low', score: 0 }
  const top = hits[0]
  const top2 = hits[1]
  const top3 = hits.slice(0, 3)
  const avgSemTop3 = top3.reduce((s, h) => s + (h.sem_score || 0), 0) / top3.length
  const maxLexTop3 = Math.max(...top3.map(h => h.lex_score || 0))
  const margin = top2 ? Math.max(0, (top.score || 0) - (top2.score || 0)) : 0

  let conf =
    0.50 * (top.sem_score || 0) +
    0.25 * avgSemTop3 +
    0.15 * maxLexTop3 +
    0.10 * Math.min(0.2, margin) / 0.2
  conf = Math.max(0, Math.min(1, conf))

  const level = conf >= 0.75 ? 'high' : conf >= 0.55 ? 'medium' : 'low'
  return { level, score: conf }
}

// ----- hybrid retrieval with normalization, RRF, boosts, ef_search -----
async function hybridQuery({
  client, qvecLit, qtext, k, scope,
  alpha = 0.7, method = 'lin', rrfK = 60, hnswEf = 40
}) {
  try { await client.query('SET hnsw.ef_search = $1', [hnswEf]) } catch (_) {}

  const { rows } = await client.query(
    `
    WITH params AS (
      SELECT $1::vector AS qvec, $2::text AS qtext, $3::int AS k,
             NULLIF($4::text,'') AS scope, $5::float AS alpha, $6::text AS method, $7::int AS rrfk
    ),
    sem AS (
      SELECT c.id, c.doc_id, c.heading, c.content, c.source_url, c.url_anchor,
             1 - (c.embedding <=> (SELECT qvec FROM params)) AS sem_score_raw,
             row_number() OVER (ORDER BY c.embedding <=> (SELECT qvec FROM params)) AS sem_rank
      FROM rag_chunks c
      WHERE (SELECT scope FROM params) IS NULL OR c.doc_id ILIKE (SELECT scope FROM params)
      ORDER BY c.embedding <=> (SELECT qvec FROM params)
      LIMIT 120
    ),
    lex_base AS (
      SELECT c.id, c.doc_id, c.heading, c.content, c.source_url, c.url_anchor,
             ts_rank_cd(c.tsv, plainto_tsquery('english', (SELECT qtext FROM params))) AS lex_score_raw,
             (CASE
                WHEN c.heading ILIKE (SELECT qtext FROM params) THEN 0.20
                WHEN c.heading ILIKE '%' || (SELECT qtext FROM params) || '%' THEN 0.10
                ELSE 0.0
              END) +
             (CASE
                WHEN (SELECT scope FROM params) IS NOT NULL AND c.doc_id ILIKE (SELECT scope FROM params) THEN 0.05
                ELSE 0.0
              END) AS boost
      FROM rag_chunks c
      WHERE ((SELECT scope FROM params) IS NULL OR c.doc_id ILIKE (SELECT scope FROM params))
        AND plainto_tsquery('english', (SELECT qtext FROM params)) @@ c.tsv
      ORDER BY lex_score_raw DESC
      LIMIT 120
    ),
    lex AS (
      SELECT *, (lex_score_raw + boost) AS lex_score_boosted,
             row_number() OVER (ORDER BY (lex_score_raw + boost) DESC) AS lex_rank
      FROM lex_base
    ),
    unioned AS (
      SELECT id, doc_id, heading, content, source_url, url_anchor,
             sem_score_raw, NULL::float AS lex_score_boosted, sem_rank, NULL::int AS lex_rank
      FROM sem
      UNION
      SELECT id, doc_id, heading, content, source_url, url_anchor,
             NULL::float, lex_score_boosted, NULL::int, lex_rank
      FROM lex
    ),
    fused AS (
      SELECT id, doc_id, heading, content, source_url, url_anchor,
             max(sem_score_raw) AS sem_score_raw,
             max(lex_score_boosted) AS lex_score_raw,
             min(sem_rank) AS sem_rank,
             min(lex_rank) AS lex_rank
      FROM unioned
      GROUP BY id, doc_id, heading, content, source_url, url_anchor
    ),
    norms AS (  -- min-max normalize & clamp to [0,1]
      SELECT *,
        LEAST(1, GREATEST(0,
          CASE WHEN (max(sem_score_raw) OVER () - min(sem_score_raw) OVER ()) > 1e-9
               THEN (sem_score_raw - min(sem_score_raw) OVER ()) / (max(sem_score_raw) OVER () - min(sem_score_raw) OVER ())
               ELSE 0 END
        )) AS sem_norm,
        LEAST(1, GREATEST(0,
          CASE WHEN (max(lex_score_raw) OVER () - min(lex_score_raw) OVER ()) > 1e-9
               THEN (lex_score_raw - min(lex_score_raw) OVER ()) / (max(lex_score_raw) OVER () - min(lex_score_raw) OVER ())
               ELSE 0 END
        )) AS lex_norm
      FROM fused
    ),
    scored AS (
      SELECT *,
        ((SELECT alpha FROM params) * sem_norm + (1 - (SELECT alpha FROM params)) * lex_norm) AS lin_score,
        (1.0 / ((SELECT rrfk FROM params) + COALESCE(sem_rank, 999999))) +
        (1.0 / ((SELECT rrfk FROM params) + COALESCE(lex_rank, 999999))) AS rrf_score
      FROM norms
    )
    SELECT
      id, doc_id, heading, content, source_url, url_anchor,
      sem_rank, lex_rank,
      sem_score_raw, lex_score_raw,
      sem_norm, lex_norm,
      CASE
        WHEN (SELECT method FROM params) = 'rrf' THEN rrf_score
        WHEN (SELECT method FROM params) = 'lin' THEN lin_score
        ELSE 0.5*lin_score + 0.5*rrf_score
      END AS score
    FROM scored
    ORDER BY score DESC
    LIMIT (SELECT k FROM params)
    `,
    [qvecLit, qtext, k, scope || null, alpha, method, rrfK]
  )

  return rows
    .map(r => ({
      rank: undefined,
      doc_id: r.doc_id,
      heading: r.heading,
      score: Number(r.score),
      sem_score: Number(r.sem_norm),      // normalized 0..1
      lex_score: Number(r.lex_norm),      // normalized 0..1
      sem_score_raw: Number(r.sem_score_raw),
      lex_score_raw: Number(r.lex_score_raw),
      sem_rank: r.sem_rank ? Number(r.sem_rank) : null,
      lex_rank: r.lex_rank ? Number(r.lex_rank) : null,
      source_url: r.source_url || null,
      url_anchor: r.url_anchor || null,
      _content: r.content
    }))
    .sort((a,b) => b.score - a.score)
    .map((r,i) => ({ ...r, rank: i+1 }))
}

// ----- health/version -----
app.get('/api/ping', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }))
app.get('/api/version', (_req, res) => res.json({ ok: true, api_version: API_VERSION, shape: 'citations_with_scores', port: PORT }))

// ----- /api/search2 -----
app.get('/api/search2', async (req, res) => {
  try {
    const q = String(req.query.q || req.query.query || '')
    const k = Math.min(50, Number(req.query.k || 10))
    const scope = req.query.path ? String(req.query.path) + '%' : null
    const alpha = req.query.alpha ? Number(req.query.alpha) : 0.7
    const method = (req.query.method || 'lin').toLowerCase() // 'lin'|'rrf'|'mix'
    const rrfK  = req.query.rrfK ? Number(req.query.rrfK) : 60
    const ef    = req.query.ef ? Number(req.query.ef) : 40
    if (!q) return res.status(400).json({ ok: false, error: 'q (or query) is required' })

    const emb = await openai.embeddings.create({ model: EMBED_MODEL, input: q })
    const qvecLit = vecLiteral(emb.data[0].embedding)

    const client = await pool.connect()
    try {
      await client.query('SET enable_seqscan = off')
      const rows = await hybridQuery({ client, qvecLit, qtext: q, k, scope, alpha, method, rrfK, hnswEf: ef })
      const hits = rows.map(({ _content, ...h }) => ({
        ...h, content_preview: (_content || '').slice(0, 180)
      }))
      return res.json({ ok: true, api_version: API_VERSION, query: q, k, scope, alpha, method, rrfK, ef, hits })
    } finally { client.release() }
  } catch (e) { console.error(e); return res.status(500).json({ ok: false, error: String(e.message || e) }) }
})

// ----- /api/ask2 -----
app.all('/api/ask2', async (req, res) => {
  try {
    const isPost = req.method === 'POST'
    const q = (isPost ? req.body?.question : req.query?.question) || ''
    const k = Math.min(50, Number((isPost ? req.body?.k : req.query?.k) || 12))
    const scopePath = (isPost ? req.body?.path : req.query?.path) || ''
    const alpha = Number((isPost ? req.body?.alpha : req.query?.alpha) || 0.7)
    const method = ((isPost ? req.body?.method : req.query?.method) || 'lin').toLowerCase()
    const rrfK  = Number((isPost ? req.body?.rrfK : req.query?.rrfK) || 60)
    const ef    = Number((isPost ? req.body?.ef   : req.query?.ef)   || 40)
    if (!q || typeof q !== 'string') return res.status(400).json({ ok: false, error: 'question is required' })

    const emb = await openai.embeddings.create({ model: EMBED_MODEL, input: q })
    const qvecLit = vecLiteral(emb.data[0].embedding)

    const client = await pool.connect()
    try {
      await client.query('SET enable_seqscan = off')
      const scope = scopePath ? `${scopePath}%` : null
      const rows = await hybridQuery({ client, qvecLit, qtext: q, k, scope, alpha, method, rrfK, hnswEf: ef })

      // context under budget
      let used = 0
      const ctx = []
      for (const r of rows) {
        const block = `### ${r.heading || 'Context'}\n${r._content}`.trim()
        if (used + block.length > MAX_CHARS) break
        ctx.push(block); used += block.length
      }

      const messages = [
        { role: 'system', content: 'Answer strictly from the provided context. If not present, say you do not know and suggest nearest docs.' },
        { role: 'user', content: `Question: ${q}\n\nContext:\n${ctx.join('\n\n')}` }
      ]
      const completion = await openai.chat.completions.create({ model: 'gpt-4o-mini', messages, temperature: 0.2 })
      const answer = completion.choices[0]?.message?.content || ''

      const hits = rows.map(({ _content, ...h }) => ({
        ...h, content_preview: (_content || '').slice(0, 180)
      }))
      const citations = hits.slice(0, 8)
      const confidence = confidenceFromHits(hits)

      return res.json({
        ok: true, api_version: API_VERSION,
        alpha, method, rrfK, ef,
        answer, citations, hits, confidence,
        used_chars: used, k, scope
      })
    } finally { client.release() }
  } catch (e) { console.error(e); return res.status(500).json({ ok: false, error: String(e.message || e) }) }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[rag-api v${API_VERSION}] listening on http://localhost:${PORT}`)
})






