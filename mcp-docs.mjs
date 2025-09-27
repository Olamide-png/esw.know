// mcp-docs.mjs
// Minimal HTTP "MCP tools" server that exposes your docs RAG as two tools:
//  - POST /tools/docs.search  -> proxies to  {SITE_ORIGIN}/api/rag/search
//  - POST /tools/docs.answer  -> proxies to  {SITE_ORIGIN}/api/rag/chat
//
// Env:
//   SITE_ORIGIN   (default: http://localhost:3000)   # your Nuxt app (RAG API)
//   PORT          (default: 8790)                    # this tool server port
//   TOOLS_BEARER  (optional)                         # if set, require this Bearer token
//
// Start:
//   SITE_ORIGIN=http://localhost:3000 \
//   TOOLS_BEARER=dev-secret \
//   PORT=8790 \
//   node mcp-docs.mjs

import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const PORT = Number(process.env.PORT || 8790)
const SITE = process.env.SITE_ORIGIN || 'http://localhost:3000'
const TOKEN = process.env.TOOLS_BEARER || null

const app = express()

// --- CORS (for browser demos like mcp-test.html) -----------------------------
app.use(cors({
  origin: true, // reflect request origin
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false
}))

// Some environments want explicit OPTIONS 204 for preflight
app.options('*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.sendStatus(204)
})

app.use(express.json({ limit: '1mb' }))

// --- auth middleware (optional) ---------------------------------------------
function requireBearer(req, res, next) {
  if (!TOKEN) return next() // no auth required
  const h = req.headers['authorization'] || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  if (!m || m[1] !== TOKEN) {
    return res.status(401).json({ error: 'unauthorized' })
  }
  next()
}

// --- helpers ----------------------------------------------------------------
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
    if (!r.ok) {
      // Pass through upstream error and status
      return { status: r.status, json: tryParse(text) ?? { error: text || 'upstream error' } }
    }
    return { status: 200, json: tryParse(text) ?? {} }
  } catch (e) {
    return { status: 500, json: { error: e?.message || String(e) } }
  } finally {
    clearTimeout(timer)
  }
}

function tryParse(s) {
  try { return JSON.parse(s) } catch { return null }
}

// --- health + manifest (handy for quick checks) -----------------------------
app.get('/health', (req, res) => {
  res.json({ ok: true, site: SITE, auth: !!TOKEN })
})

// Simple manifest so “fake agents” can discover tools
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

// --- tools ------------------------------------------------------------------

// input: { query: string, k?: number }
// output: { items: [{ title, url, excerpt?, score }], ... }
app.post('/tools/docs.search', requireBearer, async (req, res) => {
  const { query, k } = req.body || {}
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'query required (string)' })
  }

  const upstream = await proxyJson(`${SITE}/api/rag/search`, { query, k })
  res.status(upstream.status).json(upstream.json)
})

// input: { question: string, k?: number, history?: [{role, content}] }
// output: { answer: string, sources: [{ id, title, url, score }] }
app.post('/tools/docs.answer', requireBearer, async (req, res) => {
  const { question, k, history } = req.body || {}
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question required (string)' })
  }

  // We call the JSON chat route (not the SSE stream) for simplicity
  const upstream = await proxyJson(`${SITE}/api/rag/chat`, { question, k, history })
  res.status(upstream.status).json(upstream.json)
})

// --- start ------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`MCP Docs tool server running on :${PORT}`)
  console.log(`→ site origin: ${SITE}`)
  console.log(`→ auth: ${TOKEN ? 'Bearer required' : 'none'}`)
})

