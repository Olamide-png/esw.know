// server/api/nl/ask.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { handleAsk } from '../../nlweb/core'
import { loadIndex } from '../../nlweb/index'   // 👈 add: to log rows count

export default defineEventHandler(async (event) => {
  const { query, mode, k } = await readBody<{
    query: string
    mode?: 'generate' | 'list' | 'summarize'
    k?: number
  }>(event) || {}

  if (!query?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "query"' })
  }

  try {
    // 👇 helpful debug: proves the API sees the index and how many rows it has
    const rows = await loadIndex()
    console.log(`[nl] index rows=${rows.length}`)

    const out = await handleAsk({ query, mode, k })
    return out
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e?.message || 'Ask failed' })
  }
})
