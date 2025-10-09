#!/usr/bin/env node
/**
 * RAG API v2 (CJS)
 * - Embeddings: text-embedding-3-large (3072 dims) → halfvec(3072)
 * - ANN: HNSW (halfvec_cosine_ops), ef_search set per request
 * - Endpoints:
 *    GET  /api/version
 *    GET  /api/search2?q=...&k=&method=&alpha=&rrfK=&ef=&path=
 *    GET|POST /api/ask2 (query or JSON body; uses OPENAI_MODEL)
 */

require('dotenv').config();
const http = require('http');
const url = require('url');
const { Pool } = require('pg');
const OpenAI = require('openai');

// -------------------- config --------------------
const PORT = Number(process.env.RAG_API_PORT || 4000);
const HOST = process.env.RAG_BIND_HOST || '::'; // dual stack by default

const DATABASE_URL    = process.env.DATABASE_URL;
const OPENAI_API_KEY  = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';

const EMBED_MODEL   = process.env.EMBED_MODEL || 'text-embedding-3-large';
const RAG_DIM       = Number(process.env.RAG_DIM || 3072);
const RAG_MAX_CHARS = Number(process.env.RAG_MAX_CHARS || 12000);
const CHAT_MODEL    = process.env.OPENAI_MODEL || 'gpt-4o-mini';

// guards
if (!DATABASE_URL) { console.error('[rag-api] Missing DATABASE_URL'); process.exit(1); }
if (!OPENAI_API_KEY) {
  console.warn('[rag-api] WARNING: OPENAI_API_KEY not set — /api/search2 and /api/ask2 will fail when embeddings are needed.');
}

// clients
const pool = new Pool({ connectionString: DATABASE_URL });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY, baseURL: OPENAI_BASE_URL });

// -------------------- utils --------------------
function sendJson(res, code, payload) {
  const s = JSON.stringify(payload);
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(s);
}
async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 5e6) req.destroy(); });
    req.on('end', () => { if (!data) return resolve(null); try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}
function minmaxNormalize(values) {
  if (!values.length) return [];
  const lo = Math.min(...values.map(v => (isFinite(v) ? v : 0)));
  const hi = Math.max(...values.map(v => (isFinite(v) ? v : 0)));
  if (hi <= lo) return values.map(_ => 0.0);
  return values.map(v => (v - lo) / (hi - lo));
}
function rrfFuse(semRows, lexRows, k = 60) {
  const scores = new Map();
  semRows.forEach((r, i) => { const key = `${r.doc_id}::${r.chunk_id}`; scores.set(key, (scores.get(key) || 0) + 1 / (k + i + 1)); });
  lexRows.forEach((r, i) => { const key = `${r.doc_id}::${r.chunk_id}`; scores.set(key, (scores.get(key) || 0) + 1 / (k + i + 1)); });
  return scores;
}
function confidenceFromTop(hits) {
  if (!hits.length) return { level: 'low', score: 0.0 };
  const s1 = hits[0].sem_score ?? 0;
  const l1 = hits[0].lex_score ?? 0;
  const margin = hits.length > 1 ? (hits[0].score - hits[1].score) : hits[0].score;
  let score = 0.4*s1 + 0.3*l1 + 0.3*Math.max(0, Math.min(1, margin));
  const level = score >= 0.75 ? 'high' : score >= 0.5 ? 'medium' : 'low';
  return { level, score: Math.max(0, Math.min(1, score)) };
}

// -------------------- retrieval core --------------------
async function hybridSearch(client, { query, k = 12, method = 'mix', alpha = 0.7, rrfK = 100, ef = 100, path }) {
  // set ef_search per session (cannot parametrize SET)
  const efInt = Math.max(16, Math.min(10000, Number(ef) || 100));
  await client.query(`SET hnsw.ef_search = ${efInt}`);

  // embed query
  const emb = await openai.embeddings.create({ model: EMBED_MODEL, input: query });
  const qvec = emb.data[0].embedding;
  if (!qvec || qvec.length !== RAG_DIM) {
    throw new Error(`query embedding dim mismatch: got ${qvec ? qvec.length : 'null'} expected ${RAG_DIM}`);
  }

  // build a numeric vector literal and wrap as dollar-quoted text → cast to halfvec
  const vecLit = '[' + qvec.map(x => (typeof x === 'number' ? x : Number(x))).join(',') + ']';
  const vecSql = `$$${vecLit}$$::halfvec`;

  // optional scope by path prefix
  const whereSem = path ? 'WHERE c.doc_id ILIKE $2' : '';
  const semSql = `
    SELECT c.doc_id, c.chunk_id, c.heading, c.content,
           1 - (c.embedding <-> ${vecSql}) AS sem_score,
           0::float AS lex_score
    FROM rag_chunks c
    ${whereSem}
    ORDER BY c.embedding <-> ${vecSql} ASC
    LIMIT $1
  `;
  const semParams = path ? [k * 5, `${path}%`] : [k * 5];

  const lexSql = `
    SELECT c.doc_id, c.chunk_id, c.heading, c.content,
           0::float AS sem_score,
           ts_rank_cd(c.tsv, plainto_tsquery('english', $1)) AS lex_score
    FROM rag_chunks c
    WHERE plainto_tsquery('english', $1) @@ c.tsv
    ${path ? 'AND c.doc_id ILIKE $3' : ''}
    ORDER BY lex_score DESC
    LIMIT $2
  `;
  const lexParams = path ? [query, k * 5, `${path}%`] : [query, k * 5];

  const [semRes, lexRes] = await Promise.all([
    client.query(semSql, semParams),
    client.query(lexSql, lexParams)
  ]);

  const semRows = semRes.rows || [];
  const lexRows = lexRes.rows || [];

  // fusion
  let fusedMap = new Map();
  if (method === 'rrf') {
    fusedMap = rrfFuse(semRows, lexRows, Number(rrfK) || 60);
  } else {
    const sNorm = minmaxNormalize(semRows.map(r => r.sem_score ?? 0));
    const lNorm = minmaxNormalize(lexRows.map(r => r.lex_score ?? 0));
    const sByKey = new Map(semRows.map((r, i) => [`${r.doc_id}::${r.chunk_id}`, sNorm[i]]));
    const lByKey = new Map(lexRows.map((r, i) => [`${r.doc_id}::${r.chunk_id}`, lNorm[i]]));

    const all = new Set([...sByKey.keys(), ...lByKey.keys()]);
    const a = Math.max(0, Math.min(1, Number(alpha) || 0.7));
    for (const key of all) {
      const s = sByKey.get(key) || 0, l = lByKey.get(key) || 0;
      const lin = a*s + (1-a)*l;
      const mix = 0.5*lin + 0.5*((l>0 && s>0) ? (s+l)/2 : Math.max(s,l));
      fusedMap.set(key, method === 'lin' ? lin : mix);
    }
  }

  // merge best sem/lex per (doc_id, chunk_id)
  const byKey = new Map();
  function take(rows, tag) {
    for (const r of rows) {
      const key = `${r.doc_id}::${r.chunk_id}`;
      const prev = byKey.get(key) || { doc_id: r.doc_id, chunk_id: r.chunk_id, heading: r.heading, content: r.content, sem_score: 0, lex_score: 0 };
      if (tag === 'sem') prev.sem_score = Math.max(prev.sem_score, r.sem_score || 0);
      if (tag === 'lex') prev.lex_score = Math.max(prev.lex_score, r.lex_score || 0);
      if ((r.content || '').length > (prev.content || '').length) prev.content = r.content;
      byKey.set(key, prev);
    }
  }
  take(semRows, 'sem');
  take(lexRows, 'lex');

  const hits = [];
  for (const [key, score] of fusedMap.entries()) {
    const row = byKey.get(key);
    if (!row) continue;
    hits.push({
      doc_id: row.doc_id,
      chunk_id: row.chunk_id,
      heading: row.heading,
      content_preview: (row.content || '').slice(0, 320),
      sem_score: row.sem_score || 0,
      lex_score: row.lex_score || 0,
      score
    });
  }
  hits.sort((a,b) => b.score - a.score);
  return hits.slice(0, Math.min(Number(k)||12, 50));
}

// -------------------- HTTP handlers --------------------
async function handleVersion(_req, res) {
  sendJson(res, 200, { ok: true, api_version: '2', shape: 'citations_with_scores', port: PORT });
}

async function handleSearch(_req, res, q) {
  try {
    const query  = q.q || q.query;
    if (!query) return sendJson(res, 400, { ok: false, error: 'q (query) is required' });

    const k      = Number(q.k || 12);
    const method = (q.method || 'mix').toLowerCase();
    const alpha  = Number(q.alpha || 0.7);
    const rrfK   = Number(q.rrfK || 100);
    const ef     = Number(q.ef || 100);
    const path   = q.path && String(q.path);

    const client = await pool.connect();
    try {
      const hits = await hybridSearch(client, { query, k, method, alpha, rrfK, ef, path });
      sendJson(res, 200, { ok: true, hits });
    } finally { client.release(); }
  } catch (e) {
    console.error('[search2] error:', e);
    sendJson(res, 500, { ok: false, error: e.message || String(e) });
  }
}

async function handleAsk(req, res, method, bodyOrQuery) {
  try {
    const isPost   = method === 'POST';
    const params   = isPost ? (await readBody(req)) || {} : bodyOrQuery;
    const question = params.question || params.q;
    if (!question) return sendJson(res, 400, { ok: false, error: 'question is required' });

    const k        = Number(params.k || 12);
    const rMethod  = (params.method || 'mix').toLowerCase();
    const alpha    = Number(params.alpha || 0.7);
    const rrfK     = Number(params.rrfK || 100);
    const ef       = Number(params.ef || 100);
    const path     = params.path && String(params.path);

    const client = await pool.connect();
    try {
      const hits = await hybridSearch(client, { query: question, k, method: rMethod, alpha, rrfK, ef, path });

      // build context up to RAG_MAX_CHARS
      let used = 0; const blocks = [];
      for (const h of hits) {
        const block = `### ${h.heading || 'Context'}\n${h.content_preview}`;
        if (used + block.length > RAG_MAX_CHARS) break;
        blocks.push(block); used += block.length;
      }
      const context = blocks.join('\n\n');

      const sys = "Answer strictly from the provided context. If it's not in context, say you don't know and suggest where to look.";
      const messages = [
        { role: 'system', content: sys },
        { role: 'user', content: `Question: ${question}\n\nContext:\n${context}` }
      ];

      const completion = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages,
        temperature: 0.2
      });
      const answer = completion.choices?.[0]?.message?.content?.trim() || '';

      const citations = hits.slice(0, 8).map(h => ({ doc_id: h.doc_id, heading: h.heading }));
      const confidence = confidenceFromTop(hits);

      sendJson(res, 200, { ok: true, answer, citations, hits, confidence });
    } finally { client.release(); }
  } catch (e) {
    console.error('[ask2] error:', e);
    sendJson(res, 500, { ok: false, error: e.message || String(e) });
  }
}

// -------------------- router & start --------------------
const server = http.createServer(async (req, res) => {
  const u = url.parse(req.url, true);
  const p = u.pathname || '/';

  if (req.method === 'GET' && p === '/api/version') return handleVersion(req, res);
  if (req.method === 'GET' && p === '/api/search2') return handleSearch(req, res, u.query);
  if (p === '/api/ask2') return handleAsk(req, res, req.method, u.query);

  sendJson(res, 404, { ok: false, error: 'not found' });
});

server.listen(PORT, HOST, () => {
  const shown = HOST === '::' ? '[::]' : HOST;
  console.log(`[rag-api v2] listening on http://${shown}:${PORT}`);
});








