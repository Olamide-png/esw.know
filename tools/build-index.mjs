// tools/build-index.mjs
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small' // 1536 dims

function chunk(text, size=1500, overlap=200) {
  const out=[]; let i=0;
  while (i<text.length) { out.push(text.slice(i, i+size)); i += size - overlap }
  return out
}

async function embedBatch(texts) {
  const r = await fetch('https://api.openai.com/v1/embeddings', {
    method:'POST',
    headers:{ 'authorization':`Bearer ${process.env.OPENAI_API_KEY}`, 'content-type':'application/json' },
    body: JSON.stringify({ model: MODEL, input: texts })
  })
  if (!r.ok) throw new Error(`embed ${r.status} ${await r.text()}`)
  const j = await r.json()
  return j.data.map(d => d.embedding)
}

// TODO: put your documents here. Examples read local markdown files:
const DOCS = [
  { id:'intro',   title:'Intro',   url:'https://example.com/docs/intro',   path:'docs/intro.md' },
  { id:'howto',   title:'How To',  url:'https://example.com/docs/howto',   path:'docs/howto.md' },
  // or inline: { id:'policy', title:'Policy', url:'', text:'...long text...' }
]

const allChunks = []
for (const d of DOCS) {
  const text = d.text ?? await readFile(d.path, 'utf8')
  const parts = chunk(text, 1500, 200)
  // small batches to keep payloads light
  const embs = []
  for (let i=0;i<parts.length;i+=32) {
    const batch = parts.slice(i, i+32)
    const e = await embedBatch(batch)
    embs.push(...e)
  }
  parts.forEach((p, i) => {
    allChunks.push({
      doc_id: d.id,
      title: d.title,
      url: d.url,
      content: p,
      embedding: embs[i]
    })
  })
  console.log(`Indexed ${d.id}: ${parts.length} chunks`)
}

const index = { dim: 1536, chunks: allChunks }
await writeFile(join(process.cwd(), 'server/data/index.json'), JSON.stringify(index))
console.log('Wrote server/data/index.json with', allChunks.length, 'chunks')
