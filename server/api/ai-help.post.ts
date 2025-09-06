export default defineEventHandler(async (event) => {
  const body = await readBody<{
    query: string
    pageTitle?: string
    pageUrl?: string
    extraContext?: string
  }>(event)

  // Basic validation
  if (!body?.query) {
    throw createError({ statusCode: 400, statusMessage: 'Missing "query"' })
  }

  // Env
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({ statusCode: 500, statusMessage: 'OPENAI_API_KEY not set' })
  }
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const baseUrl = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '')
  const timeoutMs = Number(process.env.CHAT_TIMEOUT_MS || 20000)
  const demoMode = String(process.env.DEMO_MODE || '').toLowerCase() === 'true'

  // Demo short-circuit (useful in preview environments)
  if (demoMode) {
    return {
      answer: `DEMO MODE: You asked for help on → ${body.query}\n\nTip: Ensure required fields are set and retry.`,
    }
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

  // Timeout handling
  const ac = new AbortController()
  const id = setTimeout(() => ac.abort(), timeoutMs)

  try {
    const resp = await fetch(`${baseUrl}/responses`, {
      method: 'POST',
      signal: ac.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: prompt,
        max_output_tokens: 220,
      }),
    })

    if (!resp.ok) {
      // Return upstream error text so you can see what went wrong
      const t = await resp.text().catch(() => '')
      throw createError({ statusCode: 502, statusMessage: `AI upstream error: ${t || resp.statusText}` })
    }

    const data = await resp.json()

    // Primary: Responses API convenience field
    let answer: string | undefined = data?.output_text

    // Fallback: try to stitch text from the structured "output"
    if (!answer && Array.isArray(data?.output)) {
      try {
        const parts: string[] = []
        for (const item of data.output) {
          if (Array.isArray(item?.content)) {
            for (const c of item.content) {
              if (c?.type === 'output_text' && typeof c?.text === 'string') parts.push(c.text)
              if (c?.type === 'text' && typeof c?.text?.value === 'string') parts.push(c.text.value)
              if (typeof c === 'string') parts.push(c)
            }
          }
        }
        answer = parts.join('\n').trim()
      } catch { /* noop */ }
    }

    // Last-ditch: if neither produced anything, show a helpful message
    return { answer: answer && answer.length ? answer : 'No answer generated. (Tip: check OPENAI_MODEL and project access.)' }
  } catch (err: any) {
    // Distinguish aborts vs other errors
    if (err?.name === 'AbortError') {
      throw createError({ statusCode: 504, statusMessage: `AI request timed out after ${timeoutMs}ms` })
    }
    throw createError({ statusCode: 500, statusMessage: err?.message || 'AI request failed' })
  } finally {
    clearTimeout(id)
  }
})

