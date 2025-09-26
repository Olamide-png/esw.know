export const runtime = 'nodejs'

import { readBody } from 'h3'
import { search } from '~/www/server/nlweb/search'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ q?: string; mode?: 'list'|'summarize' }>(event)
  const q = body?.q?.trim()
  const mode = (body?.mode || 'list') as 'list'|'summarize'
  if (!q) return { ok: false, error: 'Missing "q"' }

  try {
    const data = await search({ q, mode })
    return { ok: true, data }
  } catch (err: any) {
    console.error('[nlweb/search] error:', err)
    return { ok: false, error: err?.message || 'Search failed' }
  }
})


