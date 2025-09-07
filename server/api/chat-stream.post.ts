// server/api/chat-stream.post.ts
import type { H3Event } from 'h3'

/**
 * ENV you can set (defaults shown):
 * - AI_API_KEY         -> your key (required)
 * - AI_MODEL           -> e.g. "gpt-4o-mini" or "openrouter/…"
 * - AI_BASE_URL        -> e.g. "https://api.openai.com/v1" or "https://openrouter.ai/api/v1"
 * - AI_SYSTEM_PROMPT   -> optional system primer
 */
const API_KEY   = process.env.AI_API_KEY!
const MODEL     = process.env.AI_MODEL   || 'gpt-4o-mini'
const BASE_URL  = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
const SYS       = process.env.AI_SYSTEM_PROMPT || 'You are a helpful, concise assistant.'

export default defineEventHandler(async (event: H3Event) => {
  if (!API_KEY) {
    event.node.res.statusCode = 500
    return { error: 'Missing AI_API_KEY env' }
  }

  const { messages = [] } = await readBody<{ messages: { role: 'system'|'user'|'assistant', content: string }[] }>(event)

  // Map to OpenAI-compatible schema
  const payload = {
    model: MODEL,
    stream: true,
    messages: [
      { role: 'system', content: SYS },
      ...messages.map(m => ({ role: m.role, content: String(m.content ?? '').slice(0, 4000) })),
    ],
    temperature: 0.5,
  }

  // Open an SSE response
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no') // for some proxies

  // Make the upstream streaming call (OpenAI-compatible /chat/completions)
  const upstream = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!upstream.ok || !upstream.body) {
    event.node.res.statusCode = upstream.status || 500
    event.node.res.write(`data: ${JSON.stringify({ error: `Upstream error ${upstream.status}` })}\n\n`)
    event.node.res.end()
    return
  }

  // Pipe OpenAI-style SSE into your UI format: { token }, then { done:true }
  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })

      // OpenAI/compatible streams lines starting with "data: "
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') continue

        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content || ''
          if (delta) {
            event.node.res.write(`data: ${JSON.stringify({ token: delta })}\n\n`)
          }
        } catch {
          // If upstream sent a plain fragment (some providers do)
          if (data) event.node.res.write(`data: ${JSON.stringify({ token: data })}\n\n`)
        }
      }
    }
    event.node.res.write(`data: ${JSON.stringify({ done: true })}\n\n`)
  } catch (err: any) {
    event.node.res.write(`data: ${JSON.stringify({ error: err?.message || 'stream error' })}\n\n`)
  } finally {
    event.node.res.end()
  }
})




