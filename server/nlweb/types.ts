export type CanonicalThing = {
  id: string
  url?: string
  name?: string
  description?: string
  text?: string
  image?: string
  type?: string
  section?: string
  updatedAt?: string
}

export type Chunk = {
  id: string           // thing id + position
  thingId: string
  url?: string
  title?: string
  text: string
  pos: number
  type?: string
  image?: string
  description?: string
}

export type EmbeddingRow = {
  id: string           // chunk id
  vector: number[]
  meta: Chunk
}
