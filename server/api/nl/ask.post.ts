import { defineEventHandler, readBody, createError } from 'h3'
import { handleAsk } from '../../nlweb/core'

export default defineEventHandler(async (event) => {
  const { query, mode, k } = await readBody<{
    query: string
    mode?: 'generate'|'list'|'summarize'
    k?: number
  }>(event) || {}

  if (!query?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "query"' })
  }

  try {
    const out = await handleAsk({ query, mode, k })
    return out
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e?.message || 'Ask failed' })
  }
})
