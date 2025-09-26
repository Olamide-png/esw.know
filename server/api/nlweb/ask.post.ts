// server/api/nl/ask.post.ts
import { defineEventHandler, readBody, getHeader, createError } from 'h3'

type AskBody = { path: string; question?: string; maxChars?: number }

function stripTags(html: string) {
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '')
  const codeBlocks: string[] = []
  html = html.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, code) => {
    codeBlocks.push(code.replace(/<[^>]+>/g, ''))
    return `\n\n[[[CODEBLOCK_${codeBlocks.length - 1}]]]\n\n`
  })
  html = html.replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, inner) => {
    const level = Number(tag.slice(1))
    const text = inner.replace(/<[^>]+>/g, '').trim()
    const prefix = '#'.repeat(Math.min(level, 6))
    return `\n\n${prefix} ${text}\n\n`
  })
  html = html.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim()
    return text ? (text.length <= 60 ? `${text} (${href})` : text) : href
  })
  html = html.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => `\n• ${inner.replace(/<[^>]+>/g, '').trim()}`)
  html = html.replace(/<(p|br|hr)[^>]*>/gi, '\n')
  html = html.replace(/<[^>]+>/g, ' ')
  html = html.replace(/\[\[\[CODEBLOCK_(\d+)]]]/g, (_, idx) => `\n\`\`\`\n${codeBlocks[+idx] ?? ''}\n\`\`\`\n`)
  return html.replace(/\r/g, '').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim()
}

function splitIntoChunks(text: string, chunkSize = 1200, overlap = 200) {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length)
    let slice = text.slice(i, end)
    const lastBreak = slice.lastIndexOf('\n\n')
    if (lastBreak > chunkSize * 0.6) slice = slice.slice(0, lastBreak)
    chunks.push(slice.trim())
    i += Math.max(1, slice.length - overlap)
  }
  return chunks.filter(Boolean)
}

function scoreChunk(chunk: string, q: string) {
  const terms = q.toLowerCase().split(/\W+/).filter(Boolean)
  let score = 0
  for (const t of terms) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    score += (chunk.match(re)?.length || 0)
  }
  if (/^#{1,6}\s/m.test(chunk)) score += 1.5
  if (/```/.test(chunk)) score += 1
  return score
}

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  if (!apiKey) return null

  // Use the modern Responses API
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      input: [
        { role: 'system', content: 'You are a precise documentation assistant. Cite short headings from the context if relevant.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2
    })
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw createError({ statusCode: 500, statusMessage: `OpenAI error: ${res.status} ${text}` })
  }
  const data = await res.json()
  // Coalesce the text output across modalities
  const out = Array.isArray(data.output) ? data.output.map((p: any) => p?.content?.map((c: any) => c?.text?.value).join('') ?? '').join('') : ''
  return out || null
}

export default defineEventHandler(async (event) => {
  const { path, question = '', maxChars = 8000 } = await readBody<AskBody>(event)
  if (!path || !path.startsWith('/')) {
    throw createError({ statusCode: 400, statusMessage: 'Provide a site-relative "path" starting with "/"' })
  }

  const host = getHeader(event, 'host')
  // Prefer protocol from headers in dev; fall back to https
  const proto = getHeader(event, 'x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https')
  const origin = process.env.SITE_ORIGIN?.trim() || (host ? `${proto}://${host}` : '')
  if (!origin) throw createError({ statusCode: 500, statusMessage: 'Cannot resolve SITE_ORIGIN/Host' })

  const url = new URL(path, origin).toString()
  const htmlRes = await fetch(url, { headers: { 'Accept': 'text/html' } })
  if (!htmlRes.ok) throw createError({ statusCode: 404, statusMessage: `Failed to fetch ${url} (${htmlRes.status})` })
  const html = await htmlRes.text()

  const plain = stripTags(html).slice(0, maxChars)
  const chunks = splitIntoChunks(plain)
  const selected = question.trim()
    ? [...chunks].map(c => ({ c, s: scoreChunk(c, question) })).sort((a, b) => b.s - a.s).slice(0, 5).map(x => x.c)
    : chunks.slice(0, 5)

  const context = selected.join('\n\n---\n\n')

  // Default “context-only” response
  const base = { mode: 'context-only' as const, url, question, context }

  if (!process.env.OPENAI_API_KEY || process.env.DEMO_MODE === 'true' || !question.trim()) {
    return base
  }

  const prompt = [
    `Answer the question using ONLY the "Context" where possible.`,
    `If info is missing, say what's missing and point to the closest heading.`,
    `Be concise; include a short quote or heading when helpful.`,
    ``,
    `Question: ${question}`,
    ``,
    `Context:`,
    context
  ].join('\n')

  const answer = await callOpenAI(prompt)
  if (!answer) return base

  return {
    mode: 'qa' as const,
    url,
    question,
    answer,
    contextPreview: context.slice(0, 1200) + (context.length > 1200 ? '…' : '')
  }
})











