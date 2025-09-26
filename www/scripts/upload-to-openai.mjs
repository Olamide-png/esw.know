import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { glob } from 'glob'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const contentRoot = path.resolve(process.cwd(), 'content') // your docs live here

async function main() {
  // create (or reuse) a vector store
  let vectorStoreId = process.env.VECTOR_STORE_ID || ''
  if (!vectorStoreId) {
    const vs = await openai.vectorStores.create({ name: 'NLWeb Docs' })
    vectorStoreId = vs.id
    console.log('Created vector store:', vectorStoreId)
    console.log('Add this to .env: VECTOR_STORE_ID=' + vectorStoreId)
  }

  const files = await glob('**/*.{md,mdx}', { cwd: contentRoot, nodir: true })
  console.log('Uploading files:', files.length)

  for (const rel of files) {
    const abs = path.join(contentRoot, rel)
    const stream = fs.createReadStream(abs)
    const file = await openai.files.create({
      file: stream,
      purpose: 'assistants' // required for file_search
    })
    await openai.vectorStores.files.create(vectorStoreId, { file_id: file.id })
    console.log('Added', rel, '->', file.id)
  }

  console.log('Done. VECTOR_STORE_ID=', vectorStoreId)
}
main().catch(e => { console.error(e); process.exit(1) })
