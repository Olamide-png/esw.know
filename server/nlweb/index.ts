// server/nlweb/index.ts
import fsp from 'node:fs/promises'
import path from 'node:path'
import type { EmbeddingRow } from './types'

const DATA_DIR = path.resolve(process.cwd(), '.data')
const INDEX_FILE = path.join(DATA_DIR, 'nlweb-embeddings.json')

let cache: EmbeddingRow[] | null = null
let lastMtime = 0

async function readFileRows(): Promise<EmbeddingRow[]> {
  const buf = await fsp.readFile(INDEX_FILE, 'utf8')
  const rows = JSON.parse(buf) as EmbeddingRow[]
  return Array.isArray(rows) ? rows : []
}

export async function loadIndex(): Promise<EmbeddingRow[]> {
  try {
    const st = await fsp.stat(INDEX_FILE)
    const mtime = st.mtimeMs

    // Always reload if the file changed OR our cache is empty
    if (!cache || cache.length === 0 || mtime !== lastMtime) {
      const rows = await readFileRows()
      cache = rows
      lastMtime = mtime
    }
    return cache || []
  } catch {
    // If anything goes wrong, never cache emptiness—try again next call.
    cache = null
    lastMtime = 0
    return []
  }
}

export async function saveIndex(rows: EmbeddingRow[]) {
  await fsp.mkdir(DATA_DIR, { recursive: true })
  await fsp.writeFile(INDEX_FILE, JSON.stringify(rows, null, 2), 'utf8')
  const st = await fsp.stat(INDEX_FILE)
  lastMtime = st.mtimeMs
  cache = rows
}


