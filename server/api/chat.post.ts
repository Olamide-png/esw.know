// server/api/chat.post.ts
const API_KEY   = process.env.AI_API_KEY!
const MODEL     = process.env.AI_MODEL   || 'gpt-4o-mini'
const BASE_URL  = process.env.AI_BASE_URL || 'https://api.openai.com/v1'
const SYS       = process.env.AI_SYSTEM_PROMPT || 'You are a helpful, concise assistant.'

export default defineEventHandler(async (event) => {
  if (!API_KEY) {
    event.node.res.statusCode = 500
    return { error: 'Missing AI_API_KEY env' }
  }

  // Accept either { q, meta } or { messages }
  const body = await readBody<any>(event)
  let msgs: { role: 'system'|'user'|'assistant'; content: string }[] = []

  if (Array.isArray(body?.messages)) {
    msgs = body.messages
  } else if (body?.q) {
    msgs = [{ role: 'user', content: String(body.q) }]
  }

  const payload = {
    model: MODEL,
    stream: false,
    messages: [
      { role: 'system', content: SYS },
      ...msgs.map(m => ({ role: m.role, content: String(m.content ?? '').slice(0, 4000) })),
    ],
    temperature: 0.5,
  }

  const r = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!r.ok) {
    return { error: `Upstream error ${r.status}` }
  }

  const j = await r.json()
  const reply = j.choices?.[0]?.message?.content || ''
  return { reply }
})







