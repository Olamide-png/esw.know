// server/api/chat.post.ts
import { defineEventHandler, readBody, setResponseStatus } from 'h3'

// Force Node (not Edge)
export const config = { runtime: 'nodejs' } as const

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ q?: string }>(event)
    const q = (body?.q ?? '').trim()
    if (!q) {
      setResponseStatus(event, 400)
      return { error: 'Missing "q" in body.' }
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      setResponseStatus(event, 500)
      return { error: 'OPENAI_API_KEY env var is not set' }
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a concise, helpful assistant.' },
          { role: 'user', content: q },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setResponseStatus(event, res.status)
      return { error: err?.error?.message || `Upstream ${res.status}` }
    }

    const json = await res.json()
    const reply =
      json?.choices?.[0]?.message?.content?.trim() ||
      'Sorry, I could not produce a response.'
    return { reply }
  } catch (err: any) {
    setResponseStatus(event, 500)
    return {
      error: err?.message ?? String(err),
      code: err?.code,
      type: err?.type,
    }
  }
})






