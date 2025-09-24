// server/api/nlweb/ask.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<any>(event)
  const { nlwebBaseUrl } = useRuntimeConfig()

  if (!nlwebBaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'NLWEB_BASE_URL not configured' })
  }

  // Optional: allow overriding the path if your NLWeb uses a different route
  const askPath = process.env.NLWEB_ASK_PATH || '/ask'
  const target = `${nlwebBaseUrl.replace(/\/+$/, '')}${askPath}`

  try {
    const res = await $fetch(target, {
      method: 'POST',
      body,
      headers: { 'content-type': 'application/json' }
    })
    return res
  } catch (err: any) {
    // Log on server for diagnosis
    console.error('[NLWEB PROXY ERROR]', {
      target,
      status: err?.status,
      statusText: err?.statusText,
      data: err?.data,
      message: err?.message
    })
    // Forward useful context to client
    throw createError({
      statusCode: err?.status || 502,
      statusMessage: `[NLWeb upstream] ${err?.statusText || err?.message || 'Bad Gateway'}`,
      data: err?.data || { target, hint: 'Check NLWeb server logs & request body shape' }
    })
  }
})

