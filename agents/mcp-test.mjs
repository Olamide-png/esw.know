#!/usr/bin/env node
// Verbose MCP stdio client that pretty-prints tool results (hits, citations, answer, confidence).

import { spawn } from 'node:child_process'

const SERVER_CMD = process.execPath
const SERVER_ARGS = ['agents/mcp-server.mjs']

const BASE_ARGS = {
  method: 'mix',     // 'lin' | 'rrf' | 'mix'
  alpha: 0.7,
  rrfK: 60,
  ef: 60,
  path: 'content/1.shopify/', // remove if you want global
  k: 12,
  question: 'esw shopify apps',
  query: 'esw shopify apps',
}

function send(obj, label='') {
  const json = JSON.stringify(obj)
  const headers = [
    `Content-Length: ${Buffer.byteLength(json, 'utf8')}`,
    'Content-Type: application/json',
    '', ''
  ].join('\r\n')
  if (label) console.log(`[test >>] ${label}:`, json)
  child.stdin.write(headers + json)
}

function prettyHits(hits, label='HITS') {
  if (!hits?.length) {
    console.log(`\n=== ${label} === (none)`)
    return
  }
  console.log(`\n=== ${label} (${hits.length}) ===`)
  for (const h of hits) {
    const sem = h.sem_score != null ? h.sem_score.toFixed(2) : '—'
    const lex = h.lex_score != null ? h.lex_score.toFixed(2) : '—'
    const sc  = h.score     != null ? h.score.toFixed(3)     : '—'
    console.log(`#${String(h.rank).padStart(2)}  sem=${sem}  lex=${lex}  score=${sc}  ${h.doc_id}`)
  }
}

function prettyAnswer(answer) {
  if (!answer) return
  console.log('\n=== ANSWER ===\n' + answer + '\n')
}

console.log(`[test] spawning: ${SERVER_CMD} ${SERVER_ARGS.join(' ')}`)
const child = spawn(SERVER_CMD, SERVER_ARGS, { stdio: ['pipe', 'pipe', 'pipe'] })
child.stderr.setEncoding('utf8')
child.stderr.on('data', d => process.stderr.write(`[server:stderr] ${d}`))

let buf = ''
child.stdout.setEncoding('utf8')
child.stdout.on('data', chunk => {
  buf += chunk
  for (;;) {
    const hEnd = buf.indexOf('\r\n\r\n')
    if (hEnd === -1) break
    const m = /Content-Length:\s*(\d+)/i.exec(buf.slice(0, hEnd))
    if (!m) { buf = buf.slice(hEnd + 4); continue }
    const len = parseInt(m[1], 10)
    const start = hEnd + 4
    if (buf.length < start + len) break
    const body = buf.slice(start, start + len)
    buf = buf.slice(start + len)

    const msg = JSON.parse(body)

    if (msg?.result?.content?.[0]?.type === 'text') {
      const text = msg.result.content[0].text
      try {
        const parsed = JSON.parse(text)
        if (process.env.PRINT_RAW) {
          console.log('\n=== RAW ===\n' + JSON.stringify(parsed, null, 2))
        }
        if (parsed?.hits)       prettyHits(parsed.hits, 'HITS')
        if (parsed?.citations)  prettyHits(parsed.citations, 'CITATIONS')
        if (parsed?.confidence) {
          console.log(`\n=== CONFIDENCE ===  ${parsed.confidence.level.toUpperCase()} (${parsed.confidence.score.toFixed(2)})`)
        }
        if (parsed?.answer)     prettyAnswer(parsed.answer)
      } catch {
        console.log('[tool text]', text)
      }
      console.log('\n[test] got tool response; exiting')
      child.kill('SIGKILL')
      process.exit(0)
    } else {
      console.log('[test <<]', JSON.stringify(msg, null, 2))
    }
  }
})

let nextId = 1
function req(method, params = {}) {
  const id = nextId++
  send({ jsonrpc: '2.0', id, method, params }, method)
  return id
}

req('initialize', {
  protocolVersion: '2024-11-05',
  capabilities: {},
  clientInfo: { name: 'local-test', version: '0.0.3' }
})

setTimeout(() => req('tools/list'), 250)

// Default: call ask_docs (uncomment search block to test search only)
setTimeout(() => {
  req('tools/call', {
    name: 'ask_docs',
    arguments: {
      question: BASE_ARGS.question,
      k: BASE_ARGS.k,
      method: BASE_ARGS.method,
      alpha: BASE_ARGS.alpha,
      rrfK: BASE_ARGS.rrfK,
      ef: BASE_ARGS.ef,
      path: BASE_ARGS.path,
    },
  })
}, 600)

// Search test (optional):
// setTimeout(() => {
//   req('tools/call', {
//     name: 'search_docs',
//     arguments: {
//       query: BASE_ARGS.query,
//       k: BASE_ARGS.k,
//       method: BASE_ARGS.method,
//       alpha: BASE_ARGS.alpha,
//       rrfK: BASE_ARGS.rrfK,
//       ef: BASE_ARGS.ef,
//       path: BASE_ARGS.path,
//     },
//   })
// }, 600)

setTimeout(() => {
  console.error('[test] timeout; killing child')
  child.kill('SIGKILL')
  process.exit(1)
}, 30000)




