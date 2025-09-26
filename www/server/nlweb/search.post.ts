import { search as nlwebSearch } from '~/server/nlweb/search'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ q?: string, options?: any }>(event)
    if (!body?.q) {
      throw createError({ statusCode: 400, statusMessage: 'Missing "q"' })
    }
    const result = await nlwebSearch({ q: body.q, options: body.options })
    return result
  } catch (err: any) {
    console.error('[api/nlweb/search] error:', err)
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || 'Internal Error'
    })
  }
})


