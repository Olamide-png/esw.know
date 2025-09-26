import { defineEventHandler, readBody } from 'h3'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import { AskDocsRequest, AskDocsResponse, AskDocsCitation } from '~/types/ask-docs'

type EmbeddingResponse = { data: { embedding: number[] }[] }

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
const EMB_MODEL = process.env.ASKDOCS_EMB_MODEL || 'text-embedding-3-small'
const CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

// ---- tiny helpers ----------------------------------------------------------
function cosine(a: number[], b: number[]) {
  let ab=0, aa=0, bb=0
  for (let i=0; i<a.length; i++){ ab += a[i]*b[i]; aa+=a[i]*a[i]; bb+=b[i]*b[i] }
  return ab / (Math.sqrt(aa)*Math.sqrt(bb) + 1e-9)
}

async function embed(texts: string[]): Promise<number[][]> {
  const r = await $fetch<EmbeddingResponse>('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: { input: texts, model: EMB_MODEL }
  })
  return r.data.map(d => d.embedding)
}

function mdFilesRoot() {
  // prefer Nuxt Content; fall back to pages
  const contentDir = path.join(process.cwd(), 'content')
  if (fs.existsSync(contentDir)) return contentDir
  return path.join(process.cwd(), 'pages')
}

function toUrl(filePath: string) {
  // naive map: /content/x/y.md -> /x/y
  const root = mdFilesRoot()
  const rel = filePath.replace(root, '')
  return rel.replace(/index\.(md|mdx)$/, '/').replace(/\.(md|mdx)$/, '')
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

function stripMd(s: string) {
  return s
    .replace(/```[\s\S]*?```/g, ' ')   // code fences
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/[#>*_~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function listFiles(include?: string[], exclude?: string[]) {
  const root = mdFilesRoot()
  const patterns = include?.length ? include : ['**/*.md', '**/*.mdx']
  const files = new Set<string>()
  for (const pat of patterns) {
    const matches = await glob(pat, { cwd: root, nodir: true, ignore: exclude || [] })
    matches.forEach(m => files.add(path.join(root, m)))
  }
  return Array.from(files)
}

// ---- handler ---------------------------------------------------------------
export default defineEventHandler(async (event) => {
  const t0 = Date.now()
  const body = await readBody<AskDocsRequest>(event)
  const question = (body?.question || '').trim()
  if (!OPENAI_API_KEY) throw createError({ statusCode: 500, statusMessage: 'Missing OPENAI_API_KEY' })
  if (!question) throw createError({ statusCode: 400, statusMessage: 'Provide { question }' })

  const maxChars = body.maxChars ?? 12000
  const k = body.k ?? 6

  const files = await listFiles(body.include, body.exclude)
  const filtered = body.path
    ? files.filter(f => f.includes(body.path!))
    : files

  // Read & chunk
  const chunks: {
    file: string; title: string; text: string; start: number; end: number; id: string
  }[] = []

  for (const file of filtered) {
    const raw = fs.readFileSync(file, 'utf8')
    const title = (raw.match(/^#\s+(.+)$/m)?.[1] ?? path.basename(file))
    const cleaned = stripMd(raw).slice(0, maxChars) // keep it cheap
    for (const c of chunk(cleaned)) {
      chunks.push({
        file,
        title,
        text: c.text,
        start: c.start,
        end: c.end,
        id: `${path.basename(file)}:${c.start}-${c.end}`
      })
    }
  }

  if (!chunks.length) {
    return <AskDocsResponse>{
      answer: "I couldn't find any docs to search. Make sure you have markdown in `content/` or `pages/`.",
      citations: [],
      meta: { elapsedMs: Date.now()-t0, source: 'local-fs' }
    }
  }

  // Rank by embeddings
  const [qEmb] = await embed([question])
  const embChunks = await embed(chunks.map(c => c.text))
  const scored = embChunks.map((e, i) => ({ i, score: cosine(qEmb, e) }))
    .sort((a,b) => b.score - a.score)
    .slice(0, k)

  // Build context
  const contextBlocks = scored.map(s => `# ${chunks[s.i].title}\n${chunks[s.i].text}`).join('\n\n---\n\n')

  const system = [
    'You answer questions about the documentation.',
    'Cite sources with [^n] footnotes and return a concise, accurate answer.',
  ].join(' ')

  const prompt = [
    `Context:`,
    contextBlocks,
    `\n\nUser question: ${question}`,
    `Answer with footnote indices like [^1], [^2] referring to the provided sources.`
  ].join('\n')

  type ChatRes = { choices: { message: { content: string } }[]; usage?: any }

  const chat = await $fetch<ChatRes>('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: {
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    }
  })

  const answer = chat.choices[0].message.content || 'No answer.'
  const citations: AskDocsCitation[] = scored.map((s, idx) => {
    const c = chunks[s.i]
    return {
      title: c.title,
      url: toUrl(c.file),
      path: c.file,
      score: s.score,
      chunkId: c.id,
      start: c.start,
      end: c.end,
      preview: c.text.slice(0, 240) + (c.text.length > 240 ? '…' : '')
    }
  })

  const res: AskDocsResponse = {
    answer,
    citations,
    usage: { model: CHAT_MODEL, ...chat.usage },
    meta: { elapsedMs: Date.now() - t0, source: 'local-fs' }
  }
  return res
})

