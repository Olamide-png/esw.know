import fs from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import { htmlToText } from 'html-to-text'
import type { CanonicalThing, Chunk, EmbeddingRow } from './types'
import { chunkText } from './utils'
import { embedMany } from './llm'
import { saveIndex } from './index'

const md = new MarkdownIt({ html: false, linkify: true, breaks: true })

/** Convert Markdown/MDX to plain text (drop code blocks, tables, etc.) */
function mdToPlain(markdown: string): string {
  // strip fenced code to keep embeddings focused on prose
  const noCode = markdown.replace(/```[\s\S]*?```/g, '')
  const html = md.render(noCode)
  const text = htmlToText(html, {
    wordwrap: 0,
    selectors: [
      { selector: 'a', options: { ignoreHref: true } },
      { selector: 'img', format: 'skip' },
      { selector: 'code', format: 'inline' },
      { selector: 'pre', format: 'skip' }
    ]
  })
  return text.trim()
}

type IngestOptions = {
  contentDir?: string
  siteBase?: string       // e.g. 'https://your.site' to build URLs; else use file path
  maxChars: number
  overlap: number
  apiKey: string
  embedModel: string
}

export async function buildIndexFromContent(opts: IngestOptions) {
  const contentDir = path.resolve(process.cwd(), opts.contentDir || 'content')

  // Find all markdown-ish files
  const files = await fg(['**/*.md', '**/*.mdx', '**/*.mdoc', '**/*.mdc'], {
    cwd: contentDir,
    dot: false,
    onlyFiles: true,
    absolute: true
  })

  if (!files.length) {
    console.warn(`[nlweb] No markdown files found in ${contentDir}`)
  }

  const things: CanonicalThing[] = []

  for (const absFile of files) {
    const rel = path.relative(contentDir, absFile)
    const raw = await fs.readFile(absFile, 'utf8')
    const { data, content } = matter(raw)

    const text = mdToPlain(content)
    const name =
      (data.title as string) ||
      (data.headline as string) ||
      rel.replace(/\.(md|mdx|mdc|mdoc)$/i, '')

    const description =
      (data.description as string) ||
      (text.slice(0, 240).replace(/\s+/g, ' ').trim())

    // Build a URL if you have a base; otherwise fallback to file path
    const url = opts.siteBase
      ? new URL('/' + rel.replace(/index\.(md|mdx|mdc|mdoc)$/i, '').replace(/\.(md|mdx|mdc|mdoc)$/i, ''), opts.siteBase).toString()
      : 'file://' + rel

    things.push({
      id: rel.replace(/[^\w.-]/g, '_'),
      url,
      name,
      description,
      text,
      type: (data.type as string) || 'Article',
      updatedAt: (data.updatedAt as string) || new Date().toISOString(),
      image: (data.image as string) || undefined,
      section: (data.category as string) || undefined
    })
  }

  // Chunk → embed → persist
  const chunks: Chunk[] = []
  for (const t of things) {
    const parts = chunkText(t.text || '', opts.maxChars, opts.overlap)
    parts.forEach((p, i) => {
      chunks.push({
        id: `${t.id}__${i}`,
        thingId: t.id,
        url: t.url,
        title: t.name,
        text: p,
        pos: i,
        type: t.type,
        image: t.image,
        description: t.description
      })
    })
  }

  if (!chunks.length) {
    console.warn('[nlweb] No chunks created from content; index will be empty.')
    await saveIndex([])
    return 0
  }

  const vectors = await embedMany({
    apiKey: opts.apiKey,
    model: opts.embedModel,
    texts: chunks.map(c => c.text)
  })

  const rows: EmbeddingRow[] = chunks.map((c, i) => ({
    id: c.id,
    vector: vectors[i],
    meta: c
  }))

  await saveIndex(rows)
  return rows.length
}
