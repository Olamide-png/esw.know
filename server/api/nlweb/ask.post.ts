import { z } from 'zod'

const Body = z.object({
  query: z.string().min(1, 'query is required'),
  // optional knobs you might want to pass from the UI later
  limit: z.number().int().min(1).max(20).optional(),
  lang: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const body = Body.parse(await readBody(event))
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

  if (!OPENAI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY missing' })
  }

  // Guardrail: force JSON and a predictable Schema.org shape
  const system = [
    `You are a web data formatter.`,
    `Return STRICT JSON (no code fences).`,
    `Use Schema.org vocabulary on JSON-LD-like objects.`,
    `Top-level must be {"@type":"ItemList","itemListElement":[...]} where each element is either`,
    `- {"@type":"ListItem","position":N,"item": <Schema.org Thing> }`,
    `or a <Schema.org Thing>.`,
    `Prefer types: Article, NewsArticle, Product, FAQPage, HowTo, Event, Organization, Person, Place.`,
    `Include useful fields: name, headline, description, url, datePublished/startDate, image, offers, aggregateRating, acceptedAnswer, etc. Only include what makes sense.`,
    body.limit ? `Limit to ${body.limit} results.` : ``,
    body.lang ? `Answer in ${body.lang}.` : ``
  ].filter(Boolean).join(' ')

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: body.query }
  ]

  // Call OpenAI
  const resp = await $fetch<any>('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${OPENAI_API_KEY}`,
      'content-type': 'application/json'
    },
    body: {
      model: OPENAI_MODEL,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    }
  }).catch((e: any) => {
    throw createError({
      statusCode: e?.status || 502,
      statusMessage: e?.statusText || 'OpenAI error',
      data: e?.data
    })
  })

  const content = resp?.choices?.[0]?.message?.content || '{}'

  // Always return valid JSON; normalize minimal fallback
  try {
    const json = JSON.parse(content)
    // If it’s not an ItemList, wrap it
    if (json?.['@type'] !== 'ItemList') {
      return {
        '@type': 'ItemList',
        itemListElement: Array.isArray(json) ? json : [json]
      }
    }
    return json
  } catch {
    return {
      '@type': 'ItemList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, item: { '@type': 'Thing', name: String(content) } }
      ]
    }
  }
})





