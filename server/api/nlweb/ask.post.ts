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
  const val = (node.value ?? '')
  const kids = Array.isArray(node.children) ? node.children.map(bodyToText).join(' ') : ''
  return [val, kids].filter(Boolean).join(' ')
}

function makeSnippet(text: string, q: string, radius = 240): string {
  const hay = text.replace(/\s+/g, ' ').trim()
  if (!hay) return ''
  const i = q ? hay.toLowerCase().indexOf(q.toLowerCase()) : -1
  if (i < 0) return hay.slice(0, radius * 2)
  const start = Math.max(0, i - radius)
  const end = Math.min(hay.length, i + q.length + radius)
  const prefix = start > 0 ? '… ' : ''
  const suffix = end < hay.length ? ' …' : ''
  return prefix + hay.slice(start, end) + suffix
}

function scoreDoc(d: Doc, terms: string[]) {
  const title = (d.title || '').toLowerCase()
  const text = (title + ' ' + bodyToText(d.body).toLowerCase())
  let score = 0
  for (const t of terms) {
    const rx = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
    const m = text.match(rx)
    score += m ? m.length : 0
  }
  score += terms.reduce((acc, t) => acc + (title.includes(t) ? 1 : 0), 0)
  return score
}

export default defineEventHandler(async (event) => {
  const { query = '', limit = 8 } = await readBody<{ query?: string; limit?: number }>(event) || {}
  const q = query.trim()
  if (!q) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "query" in request body' })
  }

  const k = Math.min(Math.max(Number(limit ?? 8), 1), 25)

  // Fetch docs (project only what we need)
  const docs = await serverQueryContent(event)
    .only(['_path', 'title', 'description', 'image', 'body'])
    .find() as Doc[]

  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  const ranked = docs
    .map(d => ({ d, s: scoreDoc(d, terms) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, Math.max(k, 5)) // give the model a few sources even if k is small

  // Build sources payload for the model
  const sources = ranked.map(({ d }, i) => {
    const text = bodyToText(d.body)
    return {
      id: i + 1,
      title: d.title || d._path,
      url: d._path,
      snippet: makeSnippet(text || d.description || '', q)
    }
  })

  // If no sources, short-circuit gracefully
  if (!sources.length) {
    return {
      '@type': 'ItemList',
      itemListElement: [{
        '@type': 'ListItem',
        position: 1,
        item: {
          '@type': 'Thing',
          name: q,
          description: `I couldn’t find anything in your docs for: “${q}”. Try different keywords or add content under /content.`,
          url: ''
        }
      }]
    }
  }

  // Compose system & user messages for strict, grounded answers
  const system = [
    'You are a helpful documentation assistant.',
    'Answer the user using ONLY the provided sources.',
    'If the answer is not in sources, say you could not find it.',
    'Cite sources inline as [1], [2] etc. Never fabricate.',
    'Keep answers concise and actionable.'
  ].join(' ')

  const user = [
    `User question: ${q}`,
    '',
    'Sources:',
    ...sources.map(s =>
      `[${s.id}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}`
    )
  ].join('\n')

  // Call OpenAI via plain fetch (no new deps).
  // Set OPENAI_API_KEY in your environment (Vercel project settings).
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  let answer = ''

  if (OPENAI_API_KEY) {
    try {
      const resp = await $fetch<any>('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: {
          model: 'gpt-4o-mini',
          temperature: 0.2,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ]
        }
      })
      answer = resp?.choices?.[0]?.message?.content?.trim() || ''
    } catch (e) {
      // Fallback to extractive summary if API fails
      answer = ''
    }
  }

  // Fallback: if no API key or error, return a compact extractive blurb
  if (!answer) {
    const top = sources.slice(0, 3)
    answer = top
      .map(s => `• ${makeSnippet(s.snippet || '', q, 180)} [${s.id}]`)
      .join('\n')
      || `I couldn’t reach the AI right now. Here are the most relevant sections in your docs for “${q}”.`
  }

  // Shape response as ItemList for your existing UI
  const items = [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@type': 'Thing',
        name: q,
        description: answer
      }
    },
    ...sources.map((s, idx) => ({
      '@type': 'ListItem',
      position: idx + 2,
      item: {
        '@type': 'Thing',
        name: `Source [${s.id}] ${s.title}`,
        description: s.snippet,
        url: s.url
      }
    }))
  ]

  return { '@type': 'ItemList', itemListElement: items }
})








