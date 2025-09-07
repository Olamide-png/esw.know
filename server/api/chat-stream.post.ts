// server/api/chat-stream.post.ts
import { defineEventHandler, readBody, setHeader, createError } from 'h3'
import type { H3Event } from 'h3'
import { retrieveREST } from '../../utils/rag'

interface ChatMessage { role: 'system'|'user'|'assistant', content: string }

function buildSystemPrompt() {
  return (
    'You are an AI assistant for a Nuxt + shadcn docs site.\n' +
    'Use retrieved context to stay grounded. Cite inline like [Title](/path#chunk) when you copy exact phrases.\n' +
    'Be concise. If info is missing, say so briefly.'
  )
}

async function buildContext(event: H3Event, history: ChatMessage[], apiKey: string, baseUrl: string, embedModel: string) {
  const lastUser = [...history].reverse().find(m => m.role === 'user')?.content?.slice(0, 500) || ''
  if (!lastUser) return ''
  const sources = await retrieveREST(event, lastUser, apiKey, baseUrl, embedModel, 6)
  const ctx = sources.map((s,i)=>`### Doc ${i+1}: ${s.page} (${s.url})\n${s.text}`).join('\n\n')
  return ctx
}

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const apiKey = cfg.openaiApiKey as string
  const baseUrl = cfg.openaiBaseUrl as string
  const model = (cfg.openaiModel as string) || 'gpt-4.1-mini'
  const embedModel = (cfg.embedModel as string) || 'text-embedding-3-small'
  const chatMaxInput = Number(cfg.chatMaxInput || 1800)
  const chatTimeoutMs = Number(cfg.chatTimeoutMs || 20000)

  if (!apiKey) throw createError({ statusCode: 500, statusMessage: 'Missing OPENAI_API_KEY' })

  const body = await readBody<{ messages: ChatMessage[] }>(event)
  const history = Array.isArray(body?.messages) ? body!.messages : []
  const last = history.at(-1)
  if (!last || last.role !== 'user' || !last.content?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'No user message.' })
  }
  if (last.content.length > chatMaxInput) {
    throw createError({ statusCode: 413, statusMessage: `Prompt too long (>${chatMaxInput} chars)` })
  }

  // Build system + RAG context
  const system = buildSystemPrompt()
  const context = await buildContext(event, history, apiKey, baseUrl, embedModel)

  // Transform chat history for the model
  const msgs = [
    { role: 'system', content: system },
    ...(context ? [{ role: 'system' as const, content: `Context:\n${context}` }] : []),
    ...history.map(m => ({ role: m.role as 'system'|'user'|'assistant', content: m.content })),
  ]

  const controller = new AbortController()
  const abortTimer = setTimeout(() => controller.abort(), chatTimeoutMs)

  const rsp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, stream: true, temperature: 0.25, messages: msgs }),
    signal: controller.signal
  }).catch((e) => e)

  clearTimeout(abortTimer)

  const stream = new ReadableStream({
    async start(ctrl) {
      const enc = new TextEncoder()
      const send = (obj: any) => ctrl.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`))

      if (!(rsp instanceof Response)) {
        send({ error: `Network error: ${String(rsp)}` }); ctrl.close(); return
      }
      if (!rsp.ok || !rsp.body) {
        const t = await rsp.text().catch(()=> 'Unknown error')
        send({ error: `OpenAI error: ${t}` }); ctrl.close(); return
      }

      const reader = rsp.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data:')) continue
          const data = line.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const evt = JSON.parse(data)
            const delta = evt.choices?.[0]?.delta?.content
            if (typeof delta === 'string' && delta.length) {
              // emit token
              send({ token: delta })
            }
          } catch { /* ignore keepalive */ }
        }
      }

      send({ done: true })
      ctrl.close()
    }
  })

  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'X-Accel-Buffering', 'no')
  return stream
})

