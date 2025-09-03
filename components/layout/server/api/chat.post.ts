import { defineEventHandler, readBody } from 'h3'

interface ChatMessage { role: 'system'|'user'|'assistant'; content: string }

export default defineEventHandler(async (event) => {
  const { messages = [] } = await readBody<{ messages: ChatMessage[] }>(event)
  const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content || ''

  const DEMO_MODE = process.env.DEMO_MODE !== 'false' // default true

  if (DEMO_MODE) {
    return {
      reply: `👋 (Demo mode) You said: "${lastUser}"\n\nConnect a provider by editing \`server/api/chat.post.ts\` and setting DEMO_MODE=false.`,
    }
  }

  // ----- Provider wiring (OpenAI‑compatible example) -----
  // const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  // const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  // if (!OPENAI_API_KEY) {
  //   return { error: 'Missing OPENAI_API_KEY. Set it in your environment.' }
  // }
  // const r = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${OPENAI_API_KEY}`,
  //   },
  //   body: JSON.stringify({
  //     model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  //     messages,
  //     temperature: 0.7,
  //   }),
  // })
  // if (!r.ok) {
  //   const err = await r.text()
  //   return { error: `Upstream error: ${r.status} ${err}` }
  // }
  // const data = await r.json()
  // const reply = data.choices?.[0]?.message?.content || 'No reply.'
  // return { reply }

  // If not using OpenAI‑compatible, implement your provider here…
  return { error: 'Provider not configured. Set DEMO_MODE=false and implement your call.' }
})