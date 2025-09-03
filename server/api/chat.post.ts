// server/api/chat.post.ts
import { defineEventHandler, readBody, setResponseStatus } from 'h3'

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

const MAX_INPUT = Number(process.env.CHAT_MAX_INPUT ?? 1800)           // per message (in)
const MAX_DEMO_ECHO = 300
const MAX_MESSAGES = 50                                                // cap history length
const MAX_REPLY = Number(process.env.CHAT_MAX_REPLY ?? 2000)           // max chars (out)
const UPSTREAM_TIMEOUT_MS = Number(process.env.CHAT_TIMEOUT_MS ?? 20000)

function stripTags(s: string) {
  return String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}
function normalize(s: string) { return stripTags(s).replace(/\s+/g, ' ').trim() }
function clamp(s: string, n: number) { return s.length <= n ? s : s.slice(0, n) + '…' }

export default defineEventHandler(async (event) => {
  // Read & sanitize input safely
  let raw: ChatMessage[] = []
  try {
    const body = await readBody<{ messages?: ChatMessage[] }>(event)
    raw = Array.isArray(body?.messages) ? body!.messages : []
  } catch {
    raw = []
  }
  const sanitized = raw.map(m => ({ role: m.role, content: clamp(normalize(m.content), MAX_INPUT) }))
  const messages = sanitized.slice(-MAX_MESSAGES)

  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content ?? ''

  // Demo mode (short, safe echo)
  const DEMO_MODE = process.env.DEMO_MODE !== 'false'
  if (DEMO_MODE) {
    return {
      reply: `👋 (Demo mode) I’m connected. You asked: “${clamp(lastUser, MAX_DEMO_ECHO)}”.\n\nSet DEMO_MODE=false and OPENAI_API_KEY to get real answers.`
    }
  }

  // OpenAI-compatible path
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

  if (!OPENAI_API_KEY) {
    setResponseStatus(event, 400)
    return { error: 'Missing OPENAI_API_KEY. Either set DEMO_MODE=true or add a key.' }
  }

  const payload = { model: OPENAI_MODEL, messages, temperature: 0.7 }

  // Timeout guard
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const r = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: ac.signal,
    })

    if (!r.ok) {
      setResponseStatus(event, r.status)
      return { error: `Upstream error: ${r.status} ${await r.text()}` }
    }

    const data = await r.json()
    const replyRaw = String(data?.choices?.[0]?.message?.content ?? 'No reply.')
    const reply = clamp(replyRaw, MAX_REPLY) // clamp long replies
    return { reply }
  } catch (e: any) {
    setResponseStatus(event, 504)
    return { error: `Upstream timeout or network error: ${e?.message || e}` }
  } finally {
    clearTimeout(timer)
  }
})

