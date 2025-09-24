// server/api/nlweb/ask.post.ts
import { serverQueryContent } from '#content/server'

type Doc = {
  _path: string
  title?: string
  description?: string
  image?: string
  body?: any
}

function bodyToText(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(bodyToText).join(' ')
  // Content v2 MDC AST: text nodes have `value`; element nodes have `children`
  const val = (node.value ?? '')
  const kids = Array.isArray(node.children) ? node.children.map(bodyToText).join(' ') : ''
  return [val, kids].filter(Boolean).join(' ')
}

function makeSnippet(text: string, q: string, radius = 140): string {
  const hay = text.replace(/\s+/g, ' ').trim()
  const i = hay.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return hay.slice(0, radius * 2)
  const start = Math.max(0, i - radius)
  const end = Math.min(hay.length, i + q.length + radius)
  const prefix = start > 0 ? '… ' : ''
  const suffix = end < hay.length ? ' …' : ''
  return prefix + hay.slice(start, end) + suffix
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ query?: string; limit?: number }>(event)
  const query = (body?.query || '').trim()
  if (!query) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "query" in request body' })
  }

  const limit = Math.min(Math.max(Number(body?.limit ?? 8), 1), 25)

  // Pull a reasonable batch of docs then rank them in-memory (no new deps).
  // We only project what we need for speed.
  const docs = await serverQueryContent(event)
    .only(['_path', 'title', 'description', 'image', 'body'])
    .find() as Doc[]

  // Very simple scoring: count matches of all query terms in title+body
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  function scoreDoc(d: Doc) {
    const title = (d.title || '').toLowerCase()
    const text = (title + ' ' + bodyToText(d.body).toLowerCase())
    let score = 0
    for (const t of terms) {
      const rx = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
      const matches = text.match(rx)
      score += matches ? matches.length : 0
    }
    // small title bonus
    score += terms.reduce((acc, t) => acc + (title.includes(t) ? 1 : 0), 0)
    return score
  }

  const scored = docs
    .map(d => ({ d, s: scoreDoc(d) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)

  const items = scored.map(({ d }, idx) => {
    const fullText = bodyToText(d.body)
    const snippet = makeSnippet(fullText || d.description || '', query)
    return {
      '@type': 'ListItem',
      position: idx + 1,
      item: {
        '@type': 'Thing',
        name: d.title || d._path.split('/').pop() || 'Untitled',
        description: snippet,
        url: d._path,        // works with <NuxtLink> or <a target="_blank">
        image: d.image
      }
    }
  })

  // If no hits, return a gentle empty state the card can show
  if (!items.length) {
    return {
      '@type': 'ItemList',
      itemListElement: [{
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Thing',
          name: 'No results',
          description: `I couldn’t find anything in the docs for: "${query}". Try different words.`,
          url: ''
        }
      }]
    }
  }

  return { '@type': 'ItemList', itemListElement: items }
})







