#!/usr/bin/env node
// Minimal stdio MCP server exposing search_docs and ask_docs (v2 endpoints).
import 'dotenv/config'

const BASE = process.env.RAG_API_BASE || 'http://localhost:4000'
const TIMEOUT = 25000

const tools = [
  {
    name: 'search_docs',
    description: 'Hybrid search with rich scores (rank, sem/lex, fusion).',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        k: { type: 'number', default: 10 },
        path: { type: 'string' },
        method: { type: 'string', enum: ['lin', 'rrf', 'mix'], default: 'lin' },
        alpha: { type: 'number', default: 0.7 },
        rrfK: { type: 'number', default: 60 },
        ef: { type: 'number', default: 40 }
      },
      required: ['query']
    }
  },
  {
    name: 'ask_docs',
    description: 'Answer grounded in docs; returns answer, citations, hits, confidence.',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        k: { type: 'number', default: 12 },
        path: { type: 'string' },
        method: { type: 'string', enum: ['lin', 'rrf', 'mix'], default: 'lin' },
        alpha: { type: 'number', default: 0.7 },
        rrfK: { type: 'number', default: 60 },
        ef: { type: 'number', default: 40 }
      },
      required: ['question']
    }
  }
]

// ---- stdio JSON-RPC framing ----
function write(msg) {
  const json = JSON.stringify(msg)
  const hdr = `Content-Length: ${Buffer.byteLength(json, 'utf8')}\r\nContent-Type: application/json\r\n\r\n`
  process.stdout.write(hdr + json)
}
let buf = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', chunk => {
  buf += chunk
  for (;;) {
    const i = buf.indexOf('\r\n\r\n'); if (i === -1) break
    const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0,i)); if (!m) { buf = buf.slice(i+4); continue }
    const len = parseInt(m[1],10), start = i+4
    if (buf.length < start+len) break
    const msg = JSON.parse(buf.slice(start, start+len)); buf = buf.slice(start+len)
    handle(msg)
  }
})
function ok(id, result) { write({ jsonrpc: '2.0', id, result }) }
function err(id, code, message) { write({ jsonrpc: '2.0', id, error: { code, message } }) }

function withTimeout(p, ms = TIMEOUT) {
  const ctrl = new AbortController()
  const id = setTimeout(() => ctrl.abort(), ms)
  return fetch(p.url ?? p, { ...p.opts, signal: ctrl.signal }).finally(() => clearTimeout(id))
}

async function handle(msg) {
  const { id, method, params } = msg || {}
  if (method === 'initialize') return ok(id, { protocolVersion: '2024-11-05', capabilities: { tools: {} }, serverInfo: { name: 'docs-rag-bridge', version: '2.0.0' } })
  if (method === 'tools/list')   return ok(id, { tools })

  if (method === 'tools/call') {
    const name = params?.name
    const a = params?.arguments || {}
    try {
      if (name === 'search_docs') {
        const url = new URL(`${BASE}/api/search2`)
        url.searchParams.set('q', String(a.query || ''))
        url.searchParams.set('k', String(a.k ?? 10))
        if (a.path) url.searchParams.set('path', String(a.path))
        if (a.method) url.searchParams.set('method', String(a.method))
        if (a.alpha != null) url.searchParams.set('alpha', String(a.alpha))
        if (a.rrfK  != null) url.searchParams.set('rrfK',  String(a.rrfK))
        if (a.ef    != null) url.searchParams.set('ef',    String(a.ef))
        const r = await withTimeout({ url, opts: { method: 'GET' } })
        const j = await r.json()
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(j, null, 2) }] })
      }
      if (name === 'ask_docs') {
        const body = {
          question: String(a.question || ''),
          k: Number(a.k ?? 12),
          path: a.path || undefined,
          method: a.method || 'lin',
          alpha: a.alpha ?? 0.7,
          rrfK: a.rrfK ?? 60,
          ef: a.ef ?? 40
        }
        const r = await withTimeout({
          url: `${BASE}/api/ask2`,
          opts: { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }
        })
        const j = await r.json()
        return ok(id, { content: [{ type: 'text', text: JSON.stringify(j, null, 2) }] })
      }
      return err(id, -32601, `Unknown tool: ${name}`)
    } catch (e) {
      return err(id, -32000, String(e?.message || e))
    }
  }

  return err(id, -32601, `Unknown method: ${method}`)
}









