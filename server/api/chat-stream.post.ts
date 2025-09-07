// server/api/chat-stream.post.ts
import { defineEventHandler, readBody, setHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const { aiApiKey, aiBaseUrl, aiModel, aiSystemPrompt } = useRuntimeConfig()

  if (!aiApiKey) {
    setHeader(event, 'Content-Type', 'application/json')
    event.node.res.statusCode = 500
    return { error: 'Missing AI_API_KEY (runtimeConfig.aiApiKey).' }
  }

  const body = await readBody<{ messages: { role: 'system'|'user'|'assistant'; content: string }[] }>(event)
  const inputMsgs = Array.isArray(body?.messages) ? body.messages : []

  const payload = {
    model: aiModel || 'gpt-4o-mini',
    stream: true,
    temperature: 0.5,
    messages: [
      { role: 'system', content: aiSystemPrompt || 'You are a helpful, concise assistant.' },
      ...inputMsgs.map(m => ({ role: m.role, content: String(m.content ?? '').slice(0, 4000) })),
    ],
  }

  // SSE headers
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no')

  const upstream = await fetch(`${aiBaseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${aiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!upstream.ok || !upstream.body) {
    event.node.res.statusCode = upstream.status || 500
    event.node.res.write(`data: ${JSON.stringify({ error: `Upstream ${upstream.status}` })}\n\n`)
    return event.node.res.end()
  }

  const reader = upstream.body.getReader()
  const decoder = new TextDecoder()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })

      for (const line of chunk.split('\n')) {
        const t = line.trim()
        if (!t.startsWith('data:')) continue
        const data = t.slice(5).trim()
        if (data === '[DONE]') continue

        try {
          const j = JSON.parse(data)
          const delta = j?.choices?.[0]?.delta?.content || ''
          if (delta) event.node.res.write(`data: ${JSON.stringify({ token: delta })}\n\n`)
        } catch {
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





