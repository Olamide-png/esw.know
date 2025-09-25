// scripts/build-index-content.ts
import { buildIndexFromContent } from '../server/nlweb/ingest-content'
import dotenv from 'dotenv'

async function main() {
  dotenv.config()
  const apiKey = process.env.OPENAI_API_KEY!
  const embedModel = process.env.EMBED_MODEL || 'text-embedding-3-small'
  const maxChars = Number(process.env.CHUNK_MAX_CHARS || 2800)
  const overlap  = Number(process.env.CHUNK_OVERLAP || 300)

  // NEW: pick up your folder and site base
  const contentDir = process.env.CONTENT_DIR || 'content'           // <- defaults to ./content
  const siteBase   = process.env.SITE_BASE || ''                    // <- optional

  if (!apiKey) {
    console.error('OPENAI_API_KEY missing')
    process.exit(1)
  }

  const n = await buildIndexFromContent({
    contentDir,                 // <- now configurable (www/content for you)
    siteBase: siteBase || undefined,
    maxChars,
    overlap,
    apiKey,
    embedModel
  })

  console.log(`Built index from "${contentDir}" with ${n} chunks.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
