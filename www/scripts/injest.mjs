#!/usr/bin/env node
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import { stream as globStream } from 'glob'
import matter from 'gray-matter'
import { remark } from 'remark'
import strip from 'strip-markdown'
import pg from 'pg'
import OpenAI from 'openai'

const ROOT = path.resolve(process.cwd(), 'www')            // change if needed
const CONTENT_DIRS = ['content', 'pages', 'docs']
const EMBED_MODEL = process.env.EMBED_MODEL || 'text-embedding-3-large'
const RAG_DIM = Number(process.env.RAG_DIM || 3072)
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

function sha256(s) { return crypto.createHash('sha256').update(s).digest('hex') }
function toDocId(absPath) { return path.relative(ROOT, absPath).split(path.sep).join('/') }

async function mdToPlain(md) {
  const file = await remark().use(strip).process(md)
  return String(file).replace(/\s+\n/g, '\n').trim()
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
    else for (let i = 0; i < c.length; i += (maxChars - overlap))
      chunks.push({ heading: currentHeading, content: c.slice(i, i + maxChars) })
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
     SET title=EXCLUDED.title, checksum=EXCLUDED.checksum,
         source_url=COALESCE(EXCLUDED.source_url, rag_documents.source_url)`,
    [doc_id, title, checksum, source_url || null]
  )
}

async function upsertChunks(client, doc_id, chunks, embeddings) {
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i], e = embeddings[i]
    if (!e || e.length !== RAG_DIM) throw new Error(`Embedding dim mismatch: got ${e?.length}, expected ${RAG_DIM}`)
    const chunk_id = `${doc_id}::${i}`
    const tsvectorSql = `
      setweight(to_tsvector('english', coalesce($1,'')), 'A') ||
      setweight(to_tsvector('english', coalesce($2,'')), 'B')
    `
    await client.query(
      `INSERT INTO rag_chunks (doc_id, chunk_id, heading, content, tokens, url_anchor, source_url, embedding, tsv)
       VALUES ($3,$4,$1,$2,NULL,$5,NULL,$6,${tsvectorSql})
       ON CONFLICT (doc_id, chunk_id) DO UPDATE
       SET heading=EXCLUDED.heading, content=EXCLUDED.content,
           url_anchor=EXCLUDED.url_anchor, embedding=EXCLUDED.embedding, tsv=EXCLUDED.tsv`,
      [c.heading || null, c.content, doc_id, chunk_id, c.url_anchor || null, e]
    )
  }
}

async function processFile(absPath) {
  const rel = toDocId(absPath)
  const raw = await fs.readFile(absPath, 'utf8')
  const { data, content } = matter(raw)
  const title = (data && data.title) ? String(data.title) : path.basename(absPath)
  const plain = await mdToPlain(content)
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
    console.error(`Failed ${rel}:`, e)
  } finally {
    client.release()
  }
}

async function main() {
  const patterns = CONTENT_DIRS.map(d => path.join(ROOT, d, '**/*.{md,mdx,markdown}'))
  for await (const f of globStream(patterns, { nodir: true })) {
    await processFile(path.resolve(String(f)))
  }
  await pool.end()
}
main().catch(e => { console.error(e); process.exit(1) })
