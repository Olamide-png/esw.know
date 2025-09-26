// server/api/chat.post.ts
import { defineEventHandler, readBody, setResponseStatus } from 'h3'

type Role = 'system' | 'user' | 'assistant'
interface ChatMessage { role: Role; content: string }

// ----- Tunables (via env) -----
const MAX_INPUT = Number(process.env.CHAT_MAX_INPUT ?? 1800)     // per user message
const MAX_REPLY = Number(process.env.CHAT_MAX_REPLY ?? 2000)     // clamp model reply
const MAX_MESSAGES = Number(process.env.CHAT_MAX_MSGS ?? 50)     // history cap
const TIMEOUT_MS = Number(process.env.CHAT_TIMEOUT_MS ?? 20000)  // upstream timeout
const DEMO_MODE = String(process.env.DEMO_MODE ?? '').toLowerCase() === 'true'

// ----- Sanitizers -----
function stripTags(s: string) {
  return String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}
function normalize(s: string) { return stripTags(s).replace(/\s+/g, ' ').trim() }
function clamp(s: string, n: number) { return s.length <= n ? s : s.slice(0, n) + '…' }

// Build an OpenAI-style messages array from either input style.
function buildMessages(body: any): ChatMessage[] {
  // 1) If caller provided messages[], sanitize & cap.
  if (Array.isArray(body?.messages)) {
    const sanitized = (body.messages as ChatMessage[])
      .map(m => ({ role: m.role as Role, content: clamp(normalize(m.content), MAX_INPUT) }))
      .filter(m => m.role && m.content)
    return sanitized.slice(-MAX_MESSAGES)
  }

  // 2) Otherwise support the quick-help style: { query, pageTitle?, pageUrl?, extraContext? }
  const q = clamp(normalize(body?.query || ''), MAX_INPUT)
  if (!q) return []

  const pageTitle = clamp(normalize(body?.pageTitle || 'Unknown'), 200)
  const pageUrl = clamp(normalize(body?.pageUrl || 'Unknown'), 400)
  const extra = clamp(normalize(body?.extraContext || 'None'), 1200)

  const system: ChatMessage = {
    role: 'system',
    content: [
      'You are a concise documentation assistant.',
      'Return practical, step-specific guidance (<= 180 words).',
      'Prefer short bullet points. Use code only if essential.'
    ].join(' ')
  }
  const user: ChatMessage = {
    role: 'user',
    content: [
      `Page: ${pageTitle}`,
      `URL: ${pageUrl}`,
      `Extra Context: ${extra}`,
      '',
      'Problem:',
      q
    ].join('\n')
  }
  return [system, user]
}

export default defineEventHandler(async (event) => {
  // Read body safely
  let body: any = {}
  try { body = await readBody(event) } catch { body = {} }

  const messages = buildMessages(body)
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''

  // Demo mode short-circuit
  if (DEMO_MODE) {
    return {
      reply: `👋 DEMO MODE\nI’m connected. Last user input:\n“${clamp(lastUser || '(empty)', 300)}”.\n\nSet DEMO_MODE=false and provide OPENAI_API_KEY for real answers.`
    }
  }

  // Env/config
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

  if (!OPENAI_API_KEY) {
    setResponseStatus(event, 400)
    return { error: 'Missing OPENAI_API_KEY. Either set DEMO_MODE=true or add a key.' }
  }
  if (messages.length === 0) {
    setResponseStatus(event, 400)
    return { error: 'Provide either { messages: ChatMessage[] } or { query }.' }
  }

  const payload = {
    model: OPENAI_MODEL,
    messages,
    temperature: 0.4
  }

  // Timeout guard
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS)

  try {
    const r = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: ac.signal
    })

    if (!r.ok) {
      const t = await r.text().catch(() => '')
      setResponseStatus(event, r.status)
      return { error: `Upstream error: ${r.status} ${t || r.statusText}` }
    }

    const data: any = await r.json()
    const replyRaw = String(data?.choices?.[0]?.message?.content ?? 'No reply.')
    const reply = clamp(replyRaw, MAX_REPLY)
    return { reply }
  } catch (e: any) {
    setResponseStatus(event, e?.name === 'AbortError' ? 504 : 502)
    return { error: e?.name === 'AbortError'
      ? `Upstream timeout after ${TIMEOUT_MS}ms`
      : `Network/parse error: ${e?.message || e}` }
  } finally {
    clearTimeout(timer)
  }
})





