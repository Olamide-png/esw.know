import express from "express"
import cors from "cors"

// If you're on Node 16, uncomment the next line:
// import fetch from "node-fetch"

const PORT = process.env.PORT || 8790
const SITE = process.env.SITE_ORIGIN || "http://localhost:3000" // your Nuxt site

const app = express()
app.use(express.json({ limit: "1mb" }))
app.use(cors()) // optional: allow localhost dev tools

// Simple optional auth
app.use((req, res, next) => {
  const expected = process.env.TOOLS_BEARER
  if (!expected) return next()
  const got = req.headers.authorization || ""
  if (got !== `Bearer ${expected}`) return res.status(401).json({ error: "unauthorized" })
  next()
})

/**
 * Tool: docs.search
 * input: { query: string, k?: number }
 * output: { items: [{ title, excerpt, url, score }] }
 */
app.post("/tools/docs.search", async (req, res) => {
  try {
    const { query, k } = req.body || {}
    if (!query) return res.status(400).json({ error: "query required" })
    const r = await fetch(`${SITE}/api/rag/search`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query, k })
    })
    const json = await r.json()
    res.json(json)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "search failed" })
  }
})

/**
 * Tool: docs.answer
 * input: { question: string, k?: number, history?: [{role, content}] }
 * output: { answer: string, sources: [{ id, title, url, score }] }
 */
app.post("/tools/docs.answer", async (req, res) => {
  try {
    const { question, k, history } = req.body || {}
    if (!question) return res.status(400).json({ error: "question required" })
    const r = await fetch(`${SITE}/api/rag/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, k, history })
    })
    const json = await r.json()
    res.json(json)
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "answer failed" })
  }
})

app.listen(PORT, () => {
  console.log(`MCP Docs tool server listening on http://localhost:${PORT}`)
  console.log(`Proxying to site: ${SITE}`)
})

