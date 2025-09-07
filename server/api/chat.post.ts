// server/api/chat.post.ts
import { defineEventHandler, readBody } from 'h3'
import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const { q } = await readBody<{ q?: string }>(event)
  const userQuery = (q ?? '').toString().trim()
  if (!userQuery) return { error: 'Missing "q" in body.' }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const res = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a concise, helpful assistant.' },
        { role: 'user', content: userQuery },
      ],
    })
    const reply = res.choices?.[0]?.message?.content?.trim() || '…'
    return { reply }
  } catch (err: any) {
    return { error: err?.message ?? String(err) }
  }
})




