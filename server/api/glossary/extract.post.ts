import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const { text, known = [] } = await readBody<{ text: string; known?: string[] }>(event)
  const apiKey = process.env.OPENAI_API_KEY

  // No key? Return empty augmentation.
  if (!apiKey || !text?.trim()) {
    return { terms: {} as Record<string, string> }
  }

  // Keep it short + domainy
  const prompt = `
Extract up to 20 domain-specific terms from the content below and define each in <= 24 words.
Return strict JSON { "terms": { "Term": "Definition", ... } }.
Avoid generic terms; favor e-commerce, ESW, Shopify, SFCC, pricing, returns, checkout, logistics.
Do not include terms already in this list: ${known.slice(0,200).join(', ')}.

CONTENT:
${text.slice(0, 12000)}
`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a precise documentation glossary extractor.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    })
  })

  if (!res.ok) {
    return { terms: {} }
  }

  const data = await res.json()
  // Safe parse
  try {
    const obj = JSON.parse(data.choices?.[0]?.message?.content ?? '{"terms":{}}')
    return { terms: obj.terms || {} }
  } catch {
    return { terms: {} }
  }
})
