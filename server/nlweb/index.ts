import fsp from 'node:fs/promises'
import path from 'node:path'
import type { EmbeddingRow } from './types'

const DATA_DIR = path.resolve(process.cwd(), '.data')
const INDEX_FILE = path.join(DATA_DIR, 'nlweb-embeddings.json')

let cache: EmbeddingRow[] | null = null
let lastMtime = 0

export async function loadIndex(): Promise<EmbeddingRow[]> {
  try {
    const st = await fsp.stat(INDEX_FILE)
    const mtime = st.mtimeMs
    if (!cache || mtime !== lastMtime) {
      const buf = await fsp.readFile(INDEX_FILE, 'utf8')
      cache = JSON.parse(buf)
      lastMtime = mtime
    }
    return cache || []
  } catch {
    cache = []
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

