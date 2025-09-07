// server/api/chat-stream.post.ts
import { defineEventHandler, readBody, setResponseStatus, setHeader } from 'h3'

// Force Node (not Edge)
export const config = { runtime: 'nodejs' } as const

export default defineEventHandler(async (event) => {
  // Prepare SSE response
  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'Connection', 'keep-alive')

  const { res } = event.node
  // @ts-ignore - not always available, fine to ignore
  res.flushHeaders?.()

  const write = (objOrString: any) => {
    const line =
      typeof objOrString === 'string'
        ? objOrString
        : `data: ${JSON.stringify(objOrString)}`
    res.write(line + '\n\n')
  }

  try {
    const body = await readBody<{ messages?: any; q?: string; meta?: any }>(event)
    // Accept either full messages[] or simple q
    const q = (body?.q ?? '').trim()
    const messages =
      Array.isArray(body?.messages) && body.messages.length
        ? body.messages
        : [
            { role: 'system', content: 'You are a concise, helpful assistant.' },
            ...(q ? [{ role: 'user', content: q }] : []),
          ]

    if (!messages.length) {
      setResponseStatus(event, 400)
      write({ error: 'Missing "q" or "messages".' })
      write('[DONE]')
      res.end()
      return
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      setResponseStatus(event, 500)
      write({ error: 'OPENAI_API_KEY env var is not set' })
      write('[DONE]')
      res.end()
      return
    }

    const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        stream: true,
        messages,
      }),
    })

    if (!upstream.ok || !upstream.body) {
      const err = await upstream.json().catch(() => ({}))
      setResponseStatus(event, upstream.status)
      write({ error: err?.error?.message || `Upstream ${upstream.status}` })
      write('[DONE]')
      res.end()
      return
    }

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()

    let done = false
    while (!done) {
      const { value, done: upstreamDone } = await reader.read()
      if (upstreamDone) break
      const chunk = decoder.decode(value)

      for (const line of chunk.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (!payload) continue
        if (payload === '[DONE]') {
          write('[DONE]')
          res.end()
          return
        }
        try {
          const parsed = JSON.parse(payload)
          const delta = parsed?.choices?.[0]?.delta?.content
          if (delta) {
            // Match your FabChat.vue protocol
            write({ type: 'text', delta })
          }
        } catch {
          // If upstream sends a non-JSON data line (rare), pass it through as text
          write({ type: 'text', delta: payload })
        }
      }
    }

    write('[DONE]')
    res.end()
  } catch (err: any) {
    setResponseStatus(event, 500)
    // Stream the error so the client can show it in the UI
    res.write(`data: ${JSON.stringify({ error: err?.message ?? String(err) })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})



