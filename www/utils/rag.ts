import OpenAI from "openai"
import { Client } from "pg"

const EMBED_MODEL = process.env.EMBED_MODEL || "text-embedding-3-small"
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!
const DATABASE_URL = process.env.DATABASE_URL!

const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

function toVectorLiteral(v: number[]) {
  return `[${v.join(",")}]`
}

async function pg() {
  const c = new Client({ connectionString: DATABASE_URL })
  await c.connect()
  return c
}

export type SearchItem = {
  id: number
  title: string
  heading: string
  url: string | null
  score: number
  excerpt: string
}

export async function embed(text: string) {
  const r = await openai.embeddings.create({ model: EMBED_MODEL, input: text })
  return r.data[0].embedding as unknown as number[]
}

export async function searchRag(query: string, k = 8): Promise<SearchItem[]> {
  const client = await pg()
  try {
    const qvec = toVectorLiteral(await embed(query))
    const sql = `
      SELECT
        id,
        doc_id,
        heading,
        source_url,
        1 - (embedding <=> ${qvec}::vector) AS score,
        LEFT(regexp_replace(content, E'[\\n\\r\\t]+', ' ', 'g'), 280) AS excerpt
      FROM rag_chunks
      ORDER BY embedding <=> ${qvec}::vector
      LIMIT $1;
    `
    const { rows } = await client.query(sql, [k])
    return rows.map((r: any) => ({
      id: r.id,
      title: r.doc_id,
      heading: r.heading,
      url: r.source_url,
      score: Number(r.score),
      excerpt: r.excerpt,
    }))
  } finally {
    await client.end()
  }
}

export async function answerRag(
  question: string,
  k = 8,
  history: Array<{ role: "user" | "assistant" | "system"; content: string }> = []
) {
  const items = await searchRag(question, k)

  const ctx = items
    .map(
      (it, i) =>
        `#${i + 1} [${(it.score * 100).toFixed(0)}] ${it.title} > ${it.heading}\n${it.excerpt}\n${
          it.url ?? ""
        }`
    )
    .join("\n\n")

  const sys =
    "You are a concise assistant. Answer using only the context. If unsure, say so. Cite sources as [#n]."

  const messages = [
    { role: "system", content: sys },
    ...history,
    { role: "user", content: `Question: ${question}\n\nContext:\n${ctx}` },
  ] as any

  const chat = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    messages,
    temperature: 0.2,
  })

  const answer = chat.choices[0]?.message?.content ?? ""
  const sources = items.map((it, i) => ({
    id: it.id,
    title: `${it.title} > ${it.heading}`,
    url: it.url,
    score: it.score,
  }))

  return { answer, sources }
}

