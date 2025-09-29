#!/usr/bin/env node
require('dotenv').config()
const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')
const crypto = require('crypto')
const fg = require('fast-glob')
const matter = require('gray-matter')
const removeMd = require('remove-markdown')
const { Pool } = require('pg')
const OpenAI = require('openai')

const ROOT = path.resolve(process.cwd(), 'www')        // adjust if your docs live elsewhere
const CONTENT_DIRS = ['content', 'pages', 'docs']      // scanned under /www
const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-large'
const RAG_DIM = Number(process.env.RAG_DIM || 3072)

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env'); process.exit(1)
}
if (!process.env.OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in .env'); process.exit(1)
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex') }
function toDocId(absPath) { return path.relative(ROOT, absPath).split(path.sep).join('/') }

// very simple markdown → plain text (CJS-safe)
function mdToPlain(md) {
  // remove fenced code blocks first to keep chunks tight
  const noFences = md.replace(/```[\s\S]*?```/g, '')
  const noHtml = noFences.replace(/<\/?[^>]+>/g, ' ')
  const stripped = removeMd(noHtml)
  return stripped.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

function chunkByHeadings(text, maxChars = 1800, overlap = 200) {
  const lines = text.split('\n')
  const chunks = []
  let buf = []
  let currentHeading
  const flush = () => {
    if (!buf.length) return
    let c = buf.join('\n').trim()
    if (!c) return
    if (c.length <= maxChars) chunks.push({ heading: currentHeading, content: c })
    else {
      for (let i = 0; i < c.length; i += (maxChars - overlap)) {
        chunks.push({ heading: currentHeading, content: c.slice(i, i + maxChars) })
      }
    }
    buf = []
  }
  for (const line of lines) {
    const m = /^(#{1,6})\s+(.*)$/.exec(line)
    if (m) { flush(); currentHeading = m[2].trim() }
    buf.push(line)
  }
  flush()
  return chunks
}

// Convert JS array -> pgvector literal: '[1,2,3]'
function toVectorLiteral(arr) {
  if (!Array.isArray(arr)) throw new Error('embedding must be an array')
  return '[' + arr.map(n => (typeof n === 'number' ? n : Number(n))).join(',') + ']'
}

async function embedAll(texts) {
  if (!texts.length) return []
  const res = await openai.embeddings.create({ model: EMBED_MODEL, input: texts })
  return res.data.map(d => d.embedding)
}

async function upsertDocument(client, doc_id, title, checksum, source_url) {
  await client.query(
    `INSERT INTO rag_documents (doc_id, title, checksum, source_url)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (doc_id) DO UPDATE
     SET title = EXCLUDED.title,
         checksum = EXCLUDED.checksum,
         source_url = COALESCE(EXCLUDED.source_url, rag_documents.source_url)`,
    [doc_id, title, checksum, source_url || null]
  )
}

async function upsertChunks(client, doc_id, chunks, embeddings) {
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i], e = embeddings[i]
    if (!e || e.length !== RAG_DIM) {
      throw new Error(`Embedding dim mismatch: got ${e ? e.length : 'null'}, expected ${RAG_DIM}`)
    }
    const chunk_id = `${doc_id}::${i}`
    const vec = toVectorLiteral(e)
    const tsvectorSql = `
      setweight(to_tsvector('english', coalesce($1,'')), 'A') ||
      setweight(to_tsvector('english', coalesce($2,'')), 'B')
    `
    await client.query(
      `INSERT INTO rag_chunks (doc_id, chunk_id, heading, content, tokens, url_anchor, source_url, embedding, tsv)
       VALUES ($3,$4,$1,$2,NULL,$5,NULL,$6::vector,${tsvectorSql})
       ON CONFLICT (doc_id, chunk_id) DO UPDATE
       SET heading=EXCLUDED.heading,
           content=EXCLUDED.content,
           url_anchor=EXCLUDED.url_anchor,
           embedding=EXCLUDED.embedding,
           tsv=EXCLUDED.tsv`,
      [c.heading || null, c.content, doc_id, chunk_id, c.url_anchor || null, vec]
    )
  }
}

async function processFile(absPath) {
  const rel = toDocId(absPath)
  const raw = await fsp.readFile(absPath, 'utf8')
  const { data, content } = matter(raw)
  const title = (data && data.title) ? String(data.title) : path.basename(absPath)
  const plain = mdToPlain(content)
  const checksum = sha256(plain)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await upsertDocument(client, rel, title, checksum)
    const chunks = chunkByHeadings(plain)
    const embeds = await embedAll(chunks.map(c => c.content))
    await upsertChunks(client, rel, chunks, embeds)
    await client.query('COMMIT')
    console.log(`Ingested ${rel} -> ${chunks.length} chunks`)
  } catch (e) {
    await client.query('ROLLBACK')
    console.error(`Failed ${rel}:`, e.message || e)
  } finally {
    client.release()
  }
}

async function main() {
  const patterns = CONTENT_DIRS.map(d => path.join(ROOT, d, '**/*.{md,mdx,markdown}'))
  const files = await fg(patterns, { onlyFiles: true, dot: false })
  if (!files.length) {
    console.warn('No markdown files found under', patterns.join(', '))
  }
  for (const f of files) {
    await processFile(path.resolve(f))
  }
  await pool.end()
}

main().catch(err => { console.error(err); process.exit(1) })
