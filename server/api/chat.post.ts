// server/api/chat.post.ts
import { defineEventHandler, readBody, setHeader, createError } from 'h3'
import { retrieveREST } from '../utils/rag'

export default defineEventHandler(async (event) => {
  const cfg = useRuntimeConfig()
  const apiKey = cfg.openaiApiKey as string
  const baseUrl = cfg.openaiBaseUrl as string
  const model = (cfg.openaiModel as string) || 'gpt-4.1-mini'
  const embedModel = (cfg.embedModel as string) || 'text-embedding-3-small'
  const chatMaxInput = Number(cfg.chatMaxInput || 1800)
  const chatTimeoutMs = Number(cfg.chatTimeoutMs || 20000)

  if (!apiKey) throw createError({ statusCode: 500, statusMessage: 'Missing OPENAI_API_KEY' })

  const body = await readBody<{ q: string; meta?: { path?: string; sel?: string } }>(event)
  const q = (body?.q || '').trim()
  if (!q) throw createError({ statusCode: 400, statusMessage: 'Empty prompt' })
  if (q.length > chatMaxInput) {
    throw createError({ statusCode: 413, statusMessage: `Prompt too long (>${chatMaxInput} chars)` })
  }

  // ✅ pass event
  const sources = await retrieveREST(event, q, apiKey, baseUrl, embedModel, 6, body?.meta)
  const context = sources.map((s, i) => `### Doc ${i+1}: ${s.page} (${s.url})\n${s.text}`).join('\n\n')

  const sys =
    'You are a documentation RAG assistant for a Nuxt site. ' +
    'Cite sources inline as [title](/path#chunk). ' +
    'When helpful, you may also output a Generative UI JSON payload following this schema: ' +
    '{"blocks":[{"type":"code","language":"ts","content":"..."}]}. ' +
    'If you include UI, wrap it in a line exactly: <UI> {json}'

  const controller = new AbortController()
  const abortTimer = setTimeout(() => controller.abort(), chatTimeoutMs)

  const rsp = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.2,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: `Question: ${q}\n\nContext:\n${context}` }
      ]
    }),
    signal: controller.signal
  }).catch((e) => e)

  clearTimeout(abortTimer)

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      const send = (d: string) => controller.enqueue(enc.encode(`data: ${d}\n\n`))

      if (!(rsp instanceof Response)) {
        send(JSON.stringify({ type: 'text', delta: `Network error: ${String(rsp)}` }))
        controller.close(); return
      }
      if (!rsp.ok || !rsp.body) {
        const txt = await rsp.text().catch(() => 'Unknown error')
        send(JSON.stringify({ type: 'text', delta: `OpenAI error: ${txt}` }))
        controller.close(); return
      }

      const reader = rsp.body.getReader()
      const decoder = new TextDecoder()
      let uiBuffer = ''
      let inUi = false

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
            const delta = evt.choices?.[0]?.delta?.content || ''
            if (!delta) continue

            if (delta.includes('<UI>')) { inUi = true; uiBuffer += delta.split('<UI>')[1]; continue }
            if (inUi) {
              uiBuffer += delta
              if (uiBuffer.trim().endsWith('}')) {
                try { const payload = JSON.parse(uiBuffer); send(JSON.stringify({ type: 'ui', payload })) } catch {}
                uiBuffer = ''; inUi = false
              }
              continue
            }

            send(JSON.stringify({ type: 'text', delta }))
          } catch { /* ignore keep-alives */ }
        }
      }

      send('[DONE]')
      controller.close()
    }
  })

  setHeader(event, 'Content-Type', 'text/event-stream; charset=utf-8')
  setHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setHeader(event, 'X-Accel-Buffering', 'no')
  return stream
})



