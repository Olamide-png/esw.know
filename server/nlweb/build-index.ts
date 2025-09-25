import { SEED_THINGS } from './seed'
import { chunkText } from './utils'
import { embedMany } from './llm'
import { saveIndex } from './index'
import type { Chunk, EmbeddingRow } from './types'

export async function buildIndex({
  apiKey, embedModel, maxChars, overlap
}: { apiKey: string, embedModel: string, maxChars: number, overlap: number }) {
  const chunks: Chunk[] = []
  for (const thing of SEED_THINGS) {
    const parts = chunkText(thing.text || '', maxChars, overlap)
    parts.forEach((p, i) => {
      chunks.push({
        id: `${thing.id}__${i}`,
        thingId: thing.id,
        url: thing.url,
        title: thing.name,
        text: p,
        pos: i,
        type: thing.type,
        image: thing.image,
        description: thing.description
      })
    })
  }

  const vectors = await embedMany({
    apiKey,
    model: embedModel,
    texts: chunks.map(c => c.text)
  })

  const rows: EmbeddingRow[] = chunks.map((c, i) => ({
    id: c.id,
    vector: vectors[i],
    meta: c
  }))

  await saveIndex(rows)
  return rows.length
}
