// server/api/nlweb/ask.post.ts
type Chunk = {
  doc_id: string
  title?: string
  url?: string
  content: string
  embedding: number[]
}
type IndexFile = { dim: number; chunks: Chunk[] }

function dot(a:number[], b:number[]) { let s=0; for (let i=0;i<a.length;i++) s += a[i]*b[i]; return s }
function norm(a:number[]) { return Math.sqrt(dot(a,a)) }
function cosine(a:number[], b:number[]) { return dot(a,b) / (norm(a)*norm(b) || 1) }

async function embed(texts: string[], model = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small') {
  const res = await $fetch<any>('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'content-type': 'application/json'
    },
    body: { model, input: texts }
  })
  return res.data.map((d:any)=> d.embedding as number[])
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ query?: string; k?: number; limit?: number; lang?: string }>(event)
  const query = (body?.query||'').trim()
  if (!query) throw createError({ statusCode: 400, statusMessage: 'query required' })
  if (!process.env.OPENAI_API_KEY) throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })

  // 1) Load embedded index (bundled with your app)
  const idx: IndexFile = await import('~/server/data/index.json').then(m => m.default || m)
  const k = Math.min(Math.max(body?.k ?? 8, 1), 20)

  // 2) Embed the query
  const [qVec] = await embed([query])

  // 3) Rank by cosine
  const scored = idx.chunks
    .map(c => ({ score: cosine(qVec, c.embedding), ...c }))
    .sort((a,b)=> b.score - a.score)
    .slice(0, k)

  // 4) Build grounded prompt
  const system =
    `You are a documentation formatter. Return STRICT JSON only.
     Use Schema.org. Top-level: {"@type":"ItemList","itemListElement":[...]}.
     Cite only from the provided context. If unknown, say you don't know.` +
    (body?.limit ? ` Limit to ${body.limit} items.` : '') +
    (body?.lang ? ` Answer in ${body.lang}.` : '')

  const ctx = scored.map((c,i)=>
    `### Doc ${i+1} (${c.doc_id})
TITLE: ${c.title||''}
URL: ${c.url||''}
CONTENT:
${c.content}`).join('\n\n')

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: `Use ONLY this context:\n\n${ctx}\n\n---\nQuestion: ${query}` }
  ]

  // 5) Call OpenAI for the final answer (JSON only)
  const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'
  const resp = await $fetch<any>('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
    body: { model, messages, temperature: 0.1, response_format: { type: 'json_object' } }
  })

  const content = resp?.choices?.[0]?.message?.content || '{}'
  try {
    const json = JSON.parse(content)
    ;(json as any)._citations = scored.map(c => ({ doc_id: c.doc_id, title: c.title, url: c.url, score: Number(c.score.toFixed(3)) }))
    return json
  } catch {
    return { '@type':'ItemList', itemListElement:[], _citations: scored.map(c => ({ doc_id:c.doc_id, url:c.url, score: Number(c.score.toFixed(3)) })) }
  }
})



