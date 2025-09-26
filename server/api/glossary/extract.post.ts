export default defineEventHandler(async (event) => {
  const body = await readBody<{ 
    query: string
    pageTitle?: string
    pageUrl?: string
    extraContext?: string
  }>(event)

  if (!body?.query) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "query"' })
  }
  if (!process.env.OPENAI_API_KEY) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY not set' })
  }

  const prompt = `
You are a concise documentation assistant.
Return practical, step-specific guidance (<= 180 words).
Prefer short bullet points. Use code only if essential.

Page: ${body.pageTitle ?? 'Unknown'}
URL: ${body.pageUrl ?? 'Unknown'}
Extra Context: ${body.extraContext ?? 'None'}

Problem:
${body.query}
`.trim()

  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 220
    })
  })

  if (!resp.ok) {
    const t = await resp.text().catch(() => '')
    throw createError({ statusCode: 502, statusMessage: `AI upstream error: ${t || resp.statusText}` })
  }

  const data = await resp.json()
  return { answer: data.output_text ?? "No answer generated." }
})

