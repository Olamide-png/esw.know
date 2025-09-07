// server/api/chat.post.ts
import { defineEventHandler, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  // Use runtimeConfig so it works on Vercel and during build
  const { aiApiKey, aiBaseUrl, aiModel, aiSystemPrompt } = useRuntimeConfig()

  if (!aiApiKey) {
    setResponseStatus(event, 500)
    return { error: 'Missing AI_API_KEY (runtimeConfig.aiApiKey).' }
  }

  let body: any = {}
  try {
    body = await readBody(event)
  } catch (err: any) {
    setResponseStatus(event, 400)
    return { error: `Invalid JSON body: ${err?.message || 'failed to parse'}` }
  }

  // Accept either { messages } or { q }
  let msgs: { role: 'system'|'user'|'assistant'; content: string }[] = []
  if (Array.isArray(body?.messages)) {
    msgs = body.messages.map((m: any) => ({
      role: m.role,
      content: String(m.content ?? '').slice(0, 4000),
    }))
  } else if (body?.q) {
    msgs = [{ role: 'user', content: String(body.q).slice(0, 4000) }]
  } else {
    setResponseStatus(event, 400)
    return { error: 'Provide { messages } or { q } in request body.' }
  }

  const payload = {
    model: aiModel || 'gpt-4o-mini',
    stream: false,
    temperature: 0.5,
    messages: [
      { role: 'system', content: aiSystemPrompt || 'You are a helpful, concise assistant.' },
      ...msgs,
    ],
  }

  try {
    const r = await fetch(`${aiBaseUrl || 'https://api.openai.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!r.ok) {
      const text = await r.text().catch(() => '')
      setResponseStatus(event, r.status || 500)
      // Surface upstream message to the client so you can see it in the UI/console
      return { error: `Upstream ${r.status}: ${text || 'no body'}` }
    }

    const j = await r.json()
    const reply = j?.choices?.[0]?.message?.content ?? ''
    return { reply }
  } catch (err: any) {
    setResponseStatus(event, 500)
    return { error: `Request failed: ${err?.message || 'unknown error'}` }
  }
})








