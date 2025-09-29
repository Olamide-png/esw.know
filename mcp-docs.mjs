// mcp-docs.mjs
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const PORT = process.env.PORT || 8790
const SITE = process.env.SITE_ORIGIN || 'http://localhost:3000'
const TOOLS_BEARER = process.env.TOOLS_BEARER || 'dev-secret'

const app = express()
app.use(cors())
app.use(express.json())

// --- MCP discovery schema ---
const schema = {
  name: 'esw-docs',
  version: '1.0.0',
  auth: { type: 'bearer', header: 'authorization', prefix: 'Bearer ' },
  tools: [
    {
      name: 'docs.search',
      description: 'Search ESW docs. Returns items with title, url, excerpt, score.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          k: { type: 'integer', minimum: 1, maximum: 50, default: 6 },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
    {
      name: 'docs.answer',
      description: 'Ask the docs. Returns { answer, sources }.',
      input_schema: {
        type: 'object',
        properties: {
          question: { type: 'string' },
          k: { type: 'integer', minimum: 1, maximum: 50, default: 6 },
          history: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                content: { type: 'string' },
              },
              required: ['role', 'content'],
            },
            default: [],
          },
        },
        required: ['question'],
        additionalProperties: false,
      },
    },
  ],
}

// Public (no-auth) routes
app.get('/schema', (req, res) => res.json(schema))
app.get('/.well-known/mcp.json', (req, res) => res.json(schema))
app.get('/health', (req, res) => res.json({ ok: true }))

// Auth middleware for tool routes
app.use((req, res, next) => {
  // allow the 3 public routes above
  if (req.path === '/schema' || req.path === '/.well-known/mcp.json' || req.path === '/health') {
    return next()
  }
  // enforce bearer on everything else
  if (!TOOLS_BEARER) return next()
  const auth = req.headers['authorization'] || ''
  if (auth === `Bearer ${TOOLS_BEARER}`) return next()
  return res.status(401).json({ error: 'Unauthorized' })
})

// Tools
app.post('/tools/docs.search', async (req, res) => {
  try {
    const { query, k = 6 } = req.body || {}
    if (!query) return res.status(400).json({ error: 'query required' })
    const r = await fetch(`${SITE}/api/rag/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, k }),
    })
    const text = await r.text()
    try { return res.status(r.status).json(JSON.parse(text)) } catch { return res.status(r.status).send(text) }
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
})

app.post('/tools/docs.answer', async (req, res) => {
  try {
    const { question, k = 6, history = [] } = req.body || {}
    if (!question) return res.status(400).json({ error: 'question required' })
    const r = await fetch(`${SITE}/api/rag/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question, k, history }),
    })
    const text = await r.text()
    try { return res.status(r.status).json(JSON.parse(text)) } catch { return res.status(r.status).send(text) }
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) })
  }
})

app.listen(PORT, () => {
  const masked = TOOLS_BEARER ? `${TOOLS_BEARER.slice(0,2)}***` : '(none)'
  console.log(`MCP Docs server :${PORT}  SITE=${SITE}  BEARER=${masked}`)
})




