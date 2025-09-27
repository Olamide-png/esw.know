// mcp-docs.mjs
// HTTP "MCP tools" server exposing your docs RAG as two tools:
//   POST /tools/docs.search -> {SITE}/api/rag/search
//   POST /tools/docs.answer -> {SITE}/api/rag/chat
//
// Env:
//   SITE_ORIGIN   (default: http://localhost:3000)  # your Nuxt app (RAG API)
//   PORT          (default: 8790)                   # this tool server port
//   TOOLS_BEARER  (optional)                        # if set, require this Bearer token
//
// Start:
//   SITE_ORIGIN=http://localhost:3000 \
//   TOOLS_BEARER=dev-secret \
//   PORT=8790 \
//   node mcp-docs.mjs

import express from 'express'
import fetch from 'node-fetch'

const PORT  = Number(process.env.PORT || 8790)
const SITE  = process.env.SITE_ORIGIN || 'http://localhost:3000'
const TOKEN = process.env.TOOLS_BEARER || null

const app = express()

/**
 * Robust CORS (handles preflight and echoes requested headers).
 * This lets you call the tools from any origin (e.g., http://localhost:8080).
 * Same-origin users can skip CORS by visiting /test (served by this server).
 */
app.use((req, res, next) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin') // proper cache separation
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  const reqAllow = req.headers['access-control-request-headers']
  // echo whatever the browser asked for; fallback to common headers
  res.setHeader('Access-Control-Allow-Headers', reqAllow || 'Content-Type, Authorization, authorization')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})

app.use(express.json({ limit: '1mb' }))

/** Optional bearer auth */
function requireBearer(req, res, next) {
  if (!TOKEN) return next()
  const h = req.headers['authorization'] || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  if (!m || m[1] !== TOKEN) return res.status(401).json({ error: 'unauthorized' })
  next()
}

/** Small fetch helper with timeout + error passthrough */
async function proxyJson(url, body, timeoutMs = 25_000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    })
    const text = await r.text()
    if (!r.ok) return { status: r.status, json: tryParse(text) ?? { error: text || 'upstream error' } }
    return { status: 200, json: tryParse(text) ?? {} }
  } catch (e) {
    return { status: 500, json: { error: e?.message || String(e) } }
  } finally {
    clearTimeout(timer)
  }
}
function tryParse(s) { try { return JSON.parse(s) } catch { return null } }

/** Health + simple manifest */
app.get('/health', (req, res) => res.json({ ok: true, site: SITE, auth: !!TOKEN }))
app.get('/', (req, res) => {
  res.json({
    name: 'esw-docs',
    version: '1.0.0',
    description: 'HTTP MCP tools for ESW docs',
    tools: [
      { name: 'docs.search', method: 'POST', path: '/tools/docs.search' },
      { name: 'docs.answer', method: 'POST', path: '/tools/docs.answer' }
    ]
  })
})

/** Same-origin test page (no CORS) */
app.get('/test', (req, res) => {
  res.setHeader('content-type', 'text/html; charset=utf-8')
  res.end(`<!doctype html>
<meta charset="utf-8">
<title>MCP Docs Test</title>
<style>
  :root { color-scheme: light dark; }
  body { font: 14px/1.45 system-ui, sans-serif; margin: 2rem; max-width: 880px; }
  input { width: 100%; padding: .6rem; border-radius: .6rem; border: 1px solid #ddd; }
  pre { background: #0b0b0b; color: #f6f6f6; padding: .8rem; border-radius: .6rem; overflow:auto; white-space: pre-wrap; }
  .row { display: grid; grid-template-columns: 1fr auto; gap: .5rem; align-items: center; }
  button { padding: .55rem .9rem; border-radius: .6rem; border: 1px solid #111; background:#111; color:#fff; cursor:pointer; }
  .muted { color:#777 }
</style>
<h1>MCP Tools (Same-Origin Test)</h1>
<p class="muted">This page is served by the MCP server. CORS won’t apply here.</p>

<label>Server origin</label>
<input id="origin" value="http://localhost:${PORT}">

<label>Bearer token</label>
<input id="token" value="${TOKEN ?? ''}">

<h2>docs.search</h2>
<div class="row">
  <input id="q" value="international app">
  <button onclick="runSearch()">Search</button>
</div>
<pre id="out1"></pre>

<h2>docs.answer</h2>
<div class="row">
  <input id="question" value="What is the ESW International App?">
  <button onclick="runAnswer()">Ask</button>
</div>
<pre id="out2"></pre>

<script>
function show(el, data) {
  el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
}
async function postTool(origin, token, name, body) {
  try {
    const res = await fetch(origin + '/tools/' + name, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'authorization': 'Bearer ' + token } : {})
      },
      body: JSON.stringify(body)
    });
    const text = await res.text();
    try { return { ok: res.ok, status: res.status, json: JSON.parse(text) }; }
    catch   { return { ok: res.ok, status: res.status, json: text }; }
  } catch (e) {
    return { ok: false, status: 0, json: String(e) };
  }
}
async function runSearch() {
  const origin = document.getElementById('origin').value;
  const token  = document.getElementById('token').value;
  const q      = document.getElementById('q').value;
  const out    = document.getElementById('out1');
  show(out, 'Loading…');
  const r = await postTool(origin, token, 'docs.search', { query: q, k: 6 });
  show(out, r);
}
async function runAnswer() {
  const origin = document.getElementById('origin').value;
  const token  = document.getElementById('token').value;
  const question = document.getElementById('question').value;
  const out    = document.getElementById('out2');
  show(out, 'Loading…');
  const r = await postTool(origin, token, 'docs.answer', { question, k: 6 });
  show(out, r);
}
</script>`)
})

/** Tools */
// input: { query: string, k?: number }
app.post('/tools/docs.search', requireBearer, async (req, res) => {
  const { query, k } = req.body || {}
  if (!query || typeof query !== 'string') return res.status(400).json({ error: 'query required (string)' })
  const upstream = await proxyJson(`${SITE}/api/rag/search`, { query, k })
  res.status(upstream.status).json(upstream.json)
})

// input: { question: string, k?: number, history?: [{role, content}] }
app.post('/tools/docs.answer', requireBearer, async (req, res) => {
  const { question, k, history } = req.body || {}
  if (!question || typeof question !== 'string') return res.status(400).json({ error: 'question required (string)' })
  const upstream = await proxyJson(`${SITE}/api/rag/chat`, { question, k, history })
  res.status(upstream.status).json(upstream.json)
})

/** Start */
app.listen(PORT, () => {
  console.log(`MCP Docs tool server running on :${PORT}`)
  console.log(`→ site origin: ${SITE}`)
  console.log(`→ auth: ${TOKEN ? 'Bearer required' : 'none'}`)
  console.log(`→ test page: http://localhost:${PORT}/test`)
})


