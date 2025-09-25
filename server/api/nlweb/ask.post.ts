// server/api/nl/ask.post.ts
import { defineEventHandler, readBody, getHeader, createError } from 'h3'

type AskBody = {
  path: string        // e.g. "/shopify/installation/apps"
  question?: string   // optional; if omitted we just return extracted content
  maxChars?: number   // optional; default 8000
}

function stripTags(html: string) {
  // remove script/style
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
             .replace(/<style[\s\S]*?<\/style>/gi, '')
  // capture code blocks separately as markers to preserve structure
  const codeBlocks: string[] = []
  html = html.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_, code) => {
    codeBlocks.push(code.replace(/<[^>]+>/g, ''))
    return `\n\n[[[CODEBLOCK_${codeBlocks.length - 1}]]]\n\n`
  })

  // turn headings into plain text with markers
  html = html.replace(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, inner) => {
    const level = Number(tag.slice(1))
    const text = inner.replace(/<[^>]+>/g, '').trim()
    const prefix = '#'.repeat(Math.min(level, 6))
    return `\n\n${prefix} ${text}\n\n`
  })

  // links → text (keep href inline if anchor text is short)
  html = html.replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_, href, inner) => {
    const text = inner.replace(/<[^>]+>/g, '').trim()
    if (!text) return href
    return text.length <= 60 ? `${text} (${href})` : text
  })

  // lists to lines
  html = html.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, inner) => `\n• ${inner.replace(/<[^>]+>/g, '').trim()}`)

  // paragraphs and breaks
  html = html.replace(/<(p|br|hr)[^>]*>/gi, '\n')

  // remove all remaining tags
  html = html.replace(/<[^>]+>/g, ' ')

  // restore CODEBLOCKS
  html = html.replace(/\[\[\[CODEBLOCK_(\d+)]]]/g, (_, idx) => {
    const code = codeBlocks[Number(idx)] ?? ''
    return `\n\`\`\`\n${code}\n\`\`\`\n`
  })

  // collapse whitespace
  return html.replace(/\r/g, '')
             .replace(/\n{3,}/g, '\n\n')
             .replace(/[ \t]{2,}/g, ' ')
             .trim()
}

function splitIntoChunks(text: string, chunkSize = 1200, overlap = 200) {
  const chunks: string[] = []
  let i = 0
  while (i < text.length) {
    const end = Math.min(i + chunkSize, text.length)
    let slice = text.slice(i, end)
    // try to end on a paragraph boundary
    const lastBreak = slice.lastIndexOf('\n\n')
    if (lastBreak > chunkSize * 0.6) slice = slice.slice(0, lastBreak)
    chunks.push(slice.trim())
    i += Math.max(1, slice.length - overlap)
  }
  return chunks.filter(Boolean)
}

function scoreChunk(chunk: string, q: string) {
  // naive keyword scoring (boost headings and code fences)
  const terms = q.toLowerCase().split(/\W+/).filter(Boolean)
  let score = 0
  for (const t of terms) {
    const re = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const matches = chunk.match(re)
    if (matches) score += matches.length
  }
  if (/^#{1,6}\s/m.test(chunk)) score += 1.5
  if (/```/.test(chunk)) score += 1
  return score
}

async function callOpenAI(prompt: string) {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  if (!apiKey) return null

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a helpful, precise documentation assistant. Cite sections by quoting short headings you see in the context.' },
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
  return data?.choices?.[0]?.message?.content ?? ''
}

export default defineEventHandler(async (event) => {
  const { path, question = '', maxChars = 8000 } = await readBody<AskBody>(event)
  if (!path || !path.startsWith('/')) {
    throw createError({ statusCode: 400, statusMessage: 'Provide a site-relative "path" starting with "/"' })
  }

  const host = getHeader(event, 'host')
  const origin = process.env.SITE_ORIGIN?.trim() || (host ? `https://${host}` : '')
  if (!origin) {
    throw createError({ statusCode: 500, statusMessage: 'Cannot resolve SITE_ORIGIN. Set env SITE_ORIGIN or call behind a real Host.' })
  }

  // Fetch the live-rendered HTML of the page you want to QA
  const url = new URL(path, origin).toString()
  const htmlRes = await fetch(url, { headers: { 'Accept': 'text/html' } })
  if (!htmlRes.ok) {
    throw createError({ statusCode: 404, statusMessage: `Failed to fetch ${url} (${htmlRes.status})` })
  }
  const html = await htmlRes.text()

  // Extract & normalize
  const plain = stripTags(html)
  const limited = plain.slice(0, maxChars)

  // Chunk & select
  const chunks = splitIntoChunks(limited)
  let selected = chunks
  if (question.trim()) {
    selected = [...chunks]
      .map(c => ({ c, s: scoreChunk(c, question) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 5)
      .map(x => x.c)
  }

  const context = selected.join('\n\n---\n\n')

  // If no model key, just return context so you can test extraction
  if (!process.env.OPENAI_API_KEY || process.env.DEMO_MODE === 'true') {
    return {
      mode: 'context-only',
      url,
      question,
      tokensApprox: context.length,
      context
    }
  }

  // Ask the model
  const prompt = [
    `Answer the question using ONLY the "Context" where possible.`,
    `If missing, say what is missing and suggest the closest section.`,
    `Be concise and quote short headings when helpful.`,
    ``,
    `Question: ${question}`,
    ``,
    `Context:`,
    context
  ].join('\n')

  const answer = await callOpenAI(prompt)

  return {
    mode: 'qa',
    url,
    question,
    answer,
    contextPreview: context.slice(0, 1200) + (context.length > 1200 ? '…' : '')
  }
})










