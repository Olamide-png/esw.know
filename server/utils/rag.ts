import { $content } from '#content/server'
import { createError } from 'h3'

export interface DocChunk { id: string; page: string; url: string; text: string; embedding?: number[] }
const store: { chunks: DocChunk[] } = { chunks: [] }

function splitText(src: string, max = 800, overlap = 120) {
  const out: string[] = []
  for (let i = 0; i < src.length; i += (max - overlap)) out.push(src.slice(i, i + max))
  return out.map(s => s.trim()).filter(Boolean)
}

export async function ensureIndex() {
  if (store.chunks.length) return store
  const docs = await $content().where({ _extension: 'md' }).find()
  const all: DocChunk[] = []
  for (const d of docs) {
    const raw = (d.bodyText || '').toString()
    const parts = splitText(raw)
    parts.forEach((text, i) => all.push({
      id: `${d._path}#${i}`,
      page: d.title || d._path!,
      url: d._path!,
      text
    }))
  }
  store.chunks = all
  return store
}

function cosine(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i] }
  return dot / (Math.sqrt(na) * Math.sqrt(nb))
}

async function createEmbeddingsREST(apiKey: string, baseUrl: string, model: string, input: string[] | string) {
  const res = await fetch(`${baseUrl}/embeddings`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, input })
  })
  if (!res.ok) {
    const msg = await res.text()
    throw createError({ statusCode: res.status, statusMessage: `Embeddings failed: ${msg}` })
  }
  return res.json() as Promise<{ data: { embedding: number[] }[] }>
}

export async function embedAllREST(apiKey: string, baseUrl: string, embedModel: string) {
  await ensureIndex()
  const needs = store.chunks.filter(c => !c.embedding)
  if (!needs.length) return
  const batchSize = 64
  for (let i = 0; i < needs.length; i += batchSize) {
    const batch = needs.slice(i, i + batchSize)
    const input = batch.map(n => n.text)
    const { data } = await createEmbeddingsREST(apiKey, baseUrl, embedModel, input)
    data.forEach((row, j) => { batch[j].embedding = row.embedding })
  }
}

export async function retrieveREST(
  query: string,
  apiKey: string,
  baseUrl: string,
  embedModel: string,
  k = 6,
  meta?: { path?: string; sel?: string }
) {
  await ensureIndex()
  await embedAllREST(apiKey, baseUrl, embedModel)
  const { data } = await createEmbeddingsREST(apiKey, baseUrl, embedModel, query)
  const qEmb = data[0].embedding

  const bias = new Set<string>()
  if (meta?.path) store.chunks.forEach(c => { if (c.url === meta.path) bias.add(c.id) })
  if (meta?.sel)  store.chunks.forEach(c => { if (c.text.includes(meta.sel)) bias.add(c.id) })

  const scored = store.chunks.map(c => ({
    c, s: cosine(c.embedding!, qEmb) + (bias.has(c.id) ? 0.05 : 0)
  }))
  return scored.sort((a, b) => b.s - a.s).slice(0, k).map(r => r.c)
}
