export const runtime = 'nodejs'

import { readBody } from 'h3'
import { query } from '../../nlweb/query'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ question?: string }>(event)
  const question = body?.question?.trim()
  if (!question) return { ok: false, error: 'Missing "question"' }

  try {
    const data = await query({ question })
    return { ok: true, data }
  } catch (err: any) {
    console.error('[nlweb/query] error:', err)
    return { ok: false, error: err?.message || 'Query failed' }
  }
})
