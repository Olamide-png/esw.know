import fsp from 'node:fs/promises'
import path from 'node:path'
import type { EmbeddingRow } from './types'

const DATA_DIR = path.resolve(process.cwd(), '.data')
const INDEX_FILE = path.join(DATA_DIR, 'nlweb-embeddings.json')

let cache: EmbeddingRow[] | null = null

export async function loadIndex(): Promise<EmbeddingRow[]> {
  if (cache) return cache
  try {
    const buf = await fsp.readFile(INDEX_FILE, 'utf8')
    cache = JSON.parse(buf)
    return cache
  } catch {
    return []
  }
}

export async function saveIndex(rows: EmbeddingRow[]) {
  await fsp.mkdir(DATA_DIR, { recursive: true })
  await fsp.writeFile(INDEX_FILE, JSON.stringify(rows, null, 2), 'utf8')
  cache = rows
}
