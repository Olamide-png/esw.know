// scripts/ingest.ts
import 'dotenv/config'
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import matter from 'gray-matter'
import { Client } from 'pg'
import { glob } from 'glob'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import { visit } from 'unist-util-visit'
import OpenAI from 'openai'
import { toSql } from 'pgvector/pg'   // pgvector param serializer

// Defaults (override via .env)
const DOCS_GLOB     = process.env.DOCS_GLOB     || 'www/content/**/*.{md,mdx,markdown}'
const SITE_BASE_URL = process.env.SITE_BASE_URL || ''
const EMBED_MODEL   = process.env.EMBED_MODEL   || 'text-embedding-3-small' // 1536 dims

if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY')
if (!process.env.DATABASE_URL)  throw new Error('Missing DATABASE_URL')

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const pgc = new Client({ connectionString: process.env.DATABASE_URL })

type Chunk = {
  docId: string
  heading: string
  urlAnchor: string
  content: string
  index: number
  sourceUrl?: string | null
}

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}
function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s\-]/g, '').trim().replace(/\s+/g, '-')
}

async function embedAll(texts: string[]) {
  if (!texts.length) return []
  const res = await openai.embeddings.create({ model: EMBED_MODEL, input: texts })
  return res.data.map(d => d.embedding as unknown as number[])
}

/** Heading-aware chunker: H1/H2/H3 → ~1000 char chunks */
function chunkMarkdownTree(mdText: string, relPath: string): Chunk[] {
  const tree = unified().use(remarkParse).parse(mdText) as any
  const sections: { heading: string; anchor: string; paras: string[] }[] = []
  let current = { heading: 'Introduction', anchor: '#introduction', paras: [] as string[] }

  visit(tree, (node: any) => {
    if (node.type === 'heading' && node.depth <= 3) {
      if (current.paras.length) sections.push(current)
      const text =
        node.children?.filter((c: any) => c.type === 'text').map((c: any) => c.value).join(' ') ||
        'Section'
      current = { heading: text, anchor: '#' + slugify(text), paras: [] }
    }
    if (node.type === 'paragraph') {
      const para = node.children?.map((c: any) => c.value || '').join('') || ''
      if (para.trim()) current.paras.push(para.trim())
    }
    if (node.type === 'list') {
      const items: string[] = []
      node.children?.forEach((li: any) => {
        const t =
          li.children?.map((c: any) => c.children?.map((cc: any) => cc.value || '').join('') || '')
            .join(' ') || ''
        if (t.trim()) items.push('• ' + t.trim())
      })
      if (items.length) current.paras.push(items.join('\n'))
    }
  })
  if (current.paras.length) sections.push(current)

  const chunks: Chunk[] = []
  const docId = relPath.replace(/\\/g, '/')
  let index = 0

  for (const sec of sections) {
    const target = 1000
    let buf: string[] = []
    let len = 0
    const flush = () => {
      if (!buf.length) return
      chunks.push({
        docId,
        heading: sec.heading,
        urlAnchor: sec.anchor,
        content: buf.join('\n\n'),
        index,
        sourceUrl: SITE_BASE_URL
          ? new URL(docId.replace(/^.*?content\//, ''), SITE_BASE_URL).toString() + sec.anchor
          : null
      })
      buf = []; len = 0; index++
    }
    for (const p of sec.paras) {
      if (len && len + p.length > target) flush()
      buf.push(p); len += p.length
    }
    flush()
  }
  return chunks
}

async function upsertDocAndChunks(relPath: string, title: string, rawText: string, chunks: Chunk[]) {
  const checksum = sha256(rawText)
  const docId = relPath.replace(/\\/g, '/')

  await pgc.query('BEGIN')

  const { rows: existing } = await pgc.query(
    'SELECT version, checksum FROM rag_documents WHERE doc_id = $1 ORDER BY created_at DESC LIMIT 1',
    [docId]
  )
  let version = 1
  if (existing[0] && existing[0].checksum !== checksum) version = (existing[0].version || 1) + 1

  await pgc.query(
    `INSERT INTO rag_documents (doc_id, source_url, title, checksum, version)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      docId,
      SITE_BASE_URL ? new URL(docId.replace(/^.*?content\//, ''), SITE_BASE_URL).toString() : null,
      title || path.basename(docId),
      checksum,
      version
    ]
  )

  const BATCH = 64
  for (let i = 0; i < chunks.length; i += BATCH) {
    const slice = chunks.slice(i, i + BATCH)
    const embs = await embedAll(slice.map(s => s.content))
    if (embs.length !== slice.length) {
      throw new Error(`Embedding count mismatch: got ${embs.length}, expected ${slice.length}`)
    }

    for (let j = 0; j < slice.length; j++) {
      const c = slice[j]
      const vecParam = toSql(embs[j]) // ✅ pgvector parameter (no ${vec})

      await pgc.query(
        `INSERT INTO rag_chunks
         (doc_id, chunk_id, heading, content, tokens, url_anchor, source_url, version, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          docId,
          `${docId}::${c.index}`,
          c.heading,
          c.content,
          Math.ceil(c.content.length / 4),
          c.urlAnchor,
          c.sourceUrl,
          version,
          vecParam
        ]
      )
    }
  }

  await pgc.query('COMMIT')
}

async function main() {
  await pgc.connect()
  const files = await glob(DOCS_GLOB, { nodir: true })
  console.log(`Found ${files.length} files`)
  for (const absPath of files) {
    const relPath = absPath
    const raw = await fs.readFile(absPath, 'utf8')
    const { data, content } = matter(raw)
    const title = (data.title as string) || ''
    const chunks = chunkMarkdownTree(content, relPath)
    if (!chunks.length) continue
    await upsertDocAndChunks(relPath, title, content, chunks)
    console.log(`Ingested ${relPath} -> ${chunks.length} chunks`)
  }
  await pgc.end()
}

main().catch(async (e) => {
  console.error(e)
  try { await pgc.query('ROLLBACK') } catch {}
  process.exit(1)
})


