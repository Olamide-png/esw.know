// server/api/nl/ask.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'

// -------- pure helpers (no await outside handler) --------
function findDocsRoot() {
  // allow hard override for monorepos
  const override = process.env.ASKDOCS_ROOT?.trim()
  if (override) {
    const full = path.isAbsolute(override) ? override : path.join(process.cwd(), override)
    if (fs.existsSync(full)) return full
  }
  const prefixes = ['', 'www', 'apps/web', 'app', 'site']
  const dirs = ['content', 'pages', 'docs']
  for (const p of prefixes) {
    for (const d of dirs) {
      const full = path.join(process.cwd(), p, d)
      if (fs.existsSync(full)) return full
    }
  }
  return process.cwd()
}
function toUrl(filePath: string) {
  const root = findDocsRoot()
  const rel = filePath.replace(root, '')
  return rel.replace(/index\.(md|mdx|markdown)$/, '/').replace(/\.(md|mdx|markdown)$/, '')
}
function stripMd(s: string) {
  return String(s ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/[#>*_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
function chunk(text: string, size = 1400, overlap = 200) {
  const out: { start:number; end:number; text:string }[] = []
  let i = 0
  while (i < text.length) {
    const end = Math.min(text.length, i + size)
    out.push({ start: i, end, text: text.slice(i, end) })
    if (end === text.length) break
    i = end - overlap
  }
  return out
}
function escapeRe(x: string) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
function keywordScore(text: string, q: string) {
  const qs = q.toLowerCase().split(/\W+/).filter(Boolean)
  const t = text.toLowerCase()
  let s = 0
  for (const tok of qs) {
    const m = t.match(new RegExp(`\\b${escapeRe(tok)}\\b`, 'g'))
    s += m ? m.length : 0
  }
  return s
}
async function listFiles(include?: string[], exclude?: string[]) {
  const root = findDocsRoot()
  const patterns = include?.length ? include : ['**/*.md', '**/*.mdx', '**/*.markdown']
  const ignore = exclude?.length ? exclude : [
    '**/node_modules/**','**/.nuxt/**','**/.output/**','**/dist/**','**/public/**'
  ]
  const matches = await glob(patterns, { cwd: root, nodir: true, ignore })
  return matches.map(m => path.join(root, m))
}

// -------- MAIN HANDLER (synchronous helpers; all awaits inside) --------
export default defineEventHandler(async (event) => {
  const t0 = Date.now()

  // Parse body + aliases
  const raw = await readBody(event)
  const body = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw ?? {})
  const question = (body.question ?? body.query ?? body.q ?? '').toString().trim()
  const rawScope = (body.path ?? body.scope ?? '').toString().trim()
  const scope = rawScope.replace(/^\/+/, '').replace(/\/+$/, '') || undefined

  const k = Math.max(1, Number(body.k ?? 6))
  const maxChars = Number(body.maxChars ?? 12000)

  if (!question) {
    throw createError({ statusCode: 400, statusMessage: 'Provide { question } (or { query } or { q }) in JSON body' })
  }

  // ---- file discovery (glob-based scoping) ----
  const root = findDocsRoot()
  const rel = (abs: string) => path.relative(root, abs).replace(/\\/g, '/')

  // ✅ include top-level files under the scope folder AND all nested files
  const scopeInclude = scope
    ? [
        `${scope}/*.md`, `${scope}/*.mdx`, `${scope}/*.markdown`,
        `${scope}/**/*.md`, `${scope}/**/*.mdx`, `${scope}/**/*.markdown`,
      ]
    : undefined

  let files = await listFiles(scopeInclude, body.exclude)
  const fellBackToAll = !!scope && files.length === 0
  if (fellBackToAll) files = await listFiles(undefined, body.exclude)

  // ---- read + chunk ----
  const chunks: {
    file: string; title: string; text: string; start: number; end: number; id: string
  }[] = []

  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, 'utf8')
      const title = (raw.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(file))
      const cleaned = stripMd(raw).slice(0, maxChars)
      if (!cleaned) continue
      for (const c of chunk(cleaned)) {
        chunks.push({
          file,
          title,
          text: c.text,
          start: c.start,
          end: c.end,
          id: `${rel(file)}:${c.start}-${c.end}`
        })
      }
    } catch { /* ignore */ }
  }

  if (!chunks.length) {
    return {
      answer: `I couldn’t find any markdown to search in ${scope ? `scope "${scope}"` : 'the project'}.`,
      citations: [],
      usage: { model: 'keyword-only' },
      meta: {
        elapsedMs: Date.now() - t0,
        source: 'local-fs',
        scope: scope || null,
        fellBackToAll,
        scannedFiles: files.length,
        retrievalMode: 'keyword-only',
        k,
        sampleMatches: files.slice(0, 8).map(rel)
      }
    }
  }

  // ---- keyword ranking (no network, deterministic) ----
  const scored = chunks
    .map((c, i) => ({ i, score: keywordScore(c.text, question) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, k)

  // If all scores are 0 (nothing matched), still give user something: first k chunks
  const top = scored.length && scored.some(s => s.score > 0)
    ? scored
    : chunks.slice(0, Math.min(k, chunks.length)).map((_, i) => ({ i, score: 0 }))

  const citations = top.map((s) => {
    const c = chunks[s.i]
    return {
      title: c.title,
      url: toUrl(c.file),
      path: rel(c.file),
      score: s.score,
      chunkId: c.id,
      start: c.start,
      end: c.end,
      preview: c.text.slice(0, 240) + (c.text.length > 240 ? '…' : '')
    }
  })

  // A tiny, local answer so your UI isn't empty (no model yet)
  const answer =
    citations.length
      ? `Found ${citations.length} relevant section(s). See Sources below.`
      : `No relevant sections found.`

  return {
    answer,
    citations,
    usage: { model: 'keyword-only' },
    meta: {
      elapsedMs: Date.now() - t0,
      source: 'local-fs',
      scope: scope || null,
      fellBackToAll,
      scannedFiles: files.length,
      retrievalMode: 'keyword-only',
      k,
      sampleMatches: files.slice(0, 8).map(rel)
    }
  }
})








