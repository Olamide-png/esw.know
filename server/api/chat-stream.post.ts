// server/api/chat-stream.post.ts
import { defineEventHandler, readBody, setHeader, setResponseStatus } from 'h3'

interface ChatMessage { role: 'system'|'user'|'assistant'; content: string }

const MAX_INPUT = Number(process.env.CHAT_MAX_INPUT ?? 1800)
const MAX_MESSAGES = 50
const MAX_REPLY = Number(process.env.CHAT_MAX_REPLY ?? 2000)
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

function stripTags(s: string) {
  return String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}
function normalize(s: string) { return stripTags(s).replace(/\s+/g, ' ').trim() }
function clamp(s: string, n: number) { return s.length <= n ? s : s.slice(0, n) }

export default defineEventHandler(async (event) => {
  // Prepare SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')

  const write = (obj: any) => {
    // send an SSE "data:" line
    // eslint-disable-next-line no-undef
    event.node.res.write(`data: ${JSON.stringify(obj)}\n\n`)
  }
  const end = () => { try { event.node.res.end() } catch {} }

  // Abort if client disconnects
  const ac = new AbortController()
  event.node.req.on('close', () => ac.abort())

  // Read & sanitize input
  let raw: ChatMessage[] = []
  try {
    const body = await readBody<{ messages?: ChatMessage[] }>(event)
    raw = Array.isArray(body?.messages) ? body!.messages : []
  } catch {}
  const sanitized = raw.map(m => ({ role: m.role, content: clamp(normalize(m.content), MAX_INPUT) }))
  const messages = sanitized.slice(-MAX_MESSAGES)

  // Demo mode? stream a tiny fake reply
  const DEMO_MODE = (() => {
    const v = process.env.DEMO_MODE
    const isExplicitFalse = v ? /^(false|0|off|no)$/i.test(v) : false
    if (v != null) return !isExplicitFalse
    return !process.env.OPENAI_API_KEY
  })()

  if (DEMO_MODE) {
    const last = [...messages].reverse().find(m => m.role === 'user')?.content || 'your message'
    const text = `👋 (Demo) Streaming reply: I received “${last}”. Connect an API key for real answers.`
    for (const chunk of text.match(/.{1,12}/g) || []) write({ token: chunk })
    write({ done: true })
    return end()
  }

  // Real streaming via OpenAI-compatible API
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    setResponseStatus(event, 400)
    write({ error: 'Missing OPENAI_API_KEY' })
    write({ done: true })
    return end()
  }

  const payload = { model: OPENAI_MODEL, messages, temperature: 0.7, stream: true }

  try {
    const r = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify(payload),
      signal: ac.signal,
    })
    if (!r.ok || !r.body) {
      setResponseStatus(event, r.status || 500)
      write({ error: `Upstream error: ${r.status} ${await r.text()}` })
      write({ done: true })
      return end()
    }

    const reader = r.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    let sent = 0

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      // OpenAI streams as SSE lines: "data: {...}\n\n"
      const parts = buf.split('\n\n')
      buf = parts.pop() || ''
      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') { write({ done: true }); end(); return }

        try {
          const json = JSON.parse(data)
          const delta = json?.choices?.[0]?.delta?.content
          if (!delta) continue
          let token = stripTags(String(delta))
          if (!token) continue

          // clamp total output
          if (sent >= MAX_REPLY) continue
          if (sent + token.length > MAX_REPLY) token = token.slice(0, MAX_REPLY - sent)
          sent += token.length

          write({ token })
        } catch {
          // ignore bad chunk
        }
      }
    }

    write({ done: true })
    return end()
  } catch (e: any) {
    setResponseStatus(event, 504)
    write({ error: `Upstream timeout or network error: ${e?.message || e}` })
    write({ done: true })
    return end()
  }
})






