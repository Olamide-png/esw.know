// server/api/chat-stream.post.ts
import { defineEventHandler, readBody, setResponseHeader } from 'h3'
import OpenAI from 'openai'

export default defineEventHandler(async (event) => {
  const { q, meta } = await readBody<{ q?: string; meta?: Record<string, any> }>(event)
  const userQuery = (q ?? '').toString().trim()
  if (!userQuery) {
    event.node.res.statusCode = 400
    return { error: 'Missing "q" in body.' }
  }

  // SSE headers
  setResponseHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setResponseHeader(event, 'Connection', 'keep-alive')
  // Vercel/Node buffering quirks
  // @ts-ignore
  event.node.res.flushHeaders?.()

  const encoder = new TextEncoder()
  const write = (chunk: string) => event.node.res.write(encoder.encode(chunk))
  const send = (payload: any) => write(`data: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}\n\n`)

  // (optional) send a tiny UI payload at start (your client will show it in the debug box)
  // remove this block if you don’t want it:
  send({ type: 'ui', payload: { source: 'chat-stream', receivedAt: new Date().toISOString(), meta } })

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // fast/cheap + good quality. change if you want.
      stream: true,
      messages: [
        {
          role: 'system',
          content:
            'You are a concise, helpful assistant. Keep answers short unless the user asks for detail.',
        },
        { role: 'user', content: userQuery },
      ],
    })

    for await (const part of stream) {
      const delta = part.choices?.[0]?.delta?.content
      if (delta) send({ type: 'text', delta })
    }

    // finish
    send('[DONE]')
  } catch (err: any) {
    // surface the error to the UI once
    send({ type: 'text', delta: `\n\n(Streaming error: ${err?.message ?? String(err)})` })
    send('[DONE]')
  } finally {
    // end the HTTP response
    event.node.res.end()
  }
})


