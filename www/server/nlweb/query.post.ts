// Runs on Node (Nitro). Calls your local NLWeb query() function.
import { query as nlwebQuery } from '~/server/nlweb/query'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ question?: string, options?: any }>(event)
    if (!body?.question) {
      throw createError({ statusCode: 400, statusMessage: 'Missing "question"' })
    }
    const result = await nlwebQuery({ question: body.question, options: body.options })
    return result
  } catch (err: any) {
    console.error('[api/nlweb/query] error:', err)
    throw createError({
      statusCode: err?.statusCode || 500,
      statusMessage: err?.statusMessage || err?.message || 'Internal Error'
    })
  }
})


