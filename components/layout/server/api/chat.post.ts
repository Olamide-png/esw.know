// server/api/chat.post.ts
import { defineEventHandler, readBody } from 'h3'

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

// ---- limits & helpers -------------------------------------------------------
const MAX_INPUT = Number(process.env.CHAT_MAX_INPUT ?? 1800) // per message
const MAX_DEMO_ECHO = 300

function stripTags(s: string) {
  return String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}

function normalize(s: string) {
  return stripTags(s).replace(/\s+/g, ' ').trim()
}

function clamp(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n) + '…'
}

// ---- handler ----------------------------------------------------------------
export default defineEventHandler(async (event) => {
  const body = await readBody<{ messages?: ChatMessage[] }>(event)
  const raw = Array.isArray(body?.messages) ? body!.messages : []

  // sanitize & cap every message before using it
  const messages: ChatMessage[] = raw.map((m) => ({
    role: m.role,
    content: clamp(normalize(m.content), MAX_INPUT),
  }))

  const lastUser = messages.slice().reverse().find((m) => m.role === 'user')?.content ?? ''

  // Demo mode (default true) — safe, short response, never dumps big content
  const DEMO_MODE = process.env.DEMO_MODE !== 'false'
  if (DEMO_MODE) {
    return {
      reply:
        `👋 (Demo mode) I’m connected. You asked: “${clamp(lastUser, MAX_DEMO_ECHO)}”.\n\n` +
        `Set DEMO_MODE=false and OPENAI_API_KEY to get real answers.`,
    }
  }

  // ---- OpenAI-compatible path (OpenAI, OpenRouter, Together, etc.) ----------
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini'

  if (!OPENAI_API_KEY) {
    return { error: 'Missing OPENAI_API_KEY. Either set DEMO_MODE=true or add a key.' }
  }

  const payload = {
    model: OPENAI_MODEL,
    messages,
    temperature: 0.7,
  }

  const r = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  })

  if (!r.ok) {
    const text = await r.text()
    return { error: `Upstream error: ${r.status} ${text}` }
  }

  const data = await r.json()
  const reply = data?.choices?.[0]?.message?.content ?? 'No reply.'
  return { reply }
})
