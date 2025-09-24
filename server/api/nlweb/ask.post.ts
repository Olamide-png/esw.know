// server/api/nlweb/ask.post.ts
import type { H3Event } from 'h3'

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody<any>(event)
  const { nlwebBaseUrl } = useRuntimeConfig()

  if (!nlwebBaseUrl) {
    throw createError({ statusCode: 500, statusMessage: 'NLWEB_BASE_URL not configured' })
  }

  try {
    // Forward the request to NLWeb's /ask endpoint
    const res = await $fetch<any>(`${nlwebBaseUrl}/ask`, {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/json'
      }
    })
    return res
  } catch (err: any) {
    // Bubble up a clean error for the client
    throw createError({
      statusCode: err?.status || 502,
      statusMessage: err?.statusText || err?.message || 'Upstream NLWeb error',
      data: err?.data
    })
  }
})
