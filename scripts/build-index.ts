import { buildIndex } from '../server/nlweb/build-index'
import { fileURLToPath } from 'node:url'

async function main() {
  // load env at runtime
  const dotenv = await import('dotenv')
  dotenv.config()

  const apiKey = process.env.OPENAI_API_KEY!
  const embedModel = process.env.EMBED_MODEL || 'text-embedding-3-small'
  const maxChars = Number(process.env.CHUNK_MAX_CHARS || 2800)
  const overlap  = Number(process.env.CHUNK_OVERLAP || 300)

  if (!apiKey) {
    console.error('OPENAI_API_KEY missing')
    process.exit(1)
  }

  const n = await buildIndex({ apiKey, embedModel, maxChars, overlap })
  console.log(`Built index with ${n} chunks.`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
