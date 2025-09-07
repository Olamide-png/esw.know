// server/api/chat.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (!config.aiApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'AI_API_KEY is missing' });
  }

  const body = await readBody<{
    messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    q?: string;
    meta?: any;
  }>(event);

  // Accept both new (messages) and old (q) request shapes
  let messages = body?.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    const q = (body?.q || '').toString().trim();
    if (!q) {
      throw createError({ statusCode: 400, statusMessage: 'Missing messages or q' });
    }
    messages = [{ role: 'user', content: q }];
  }

  // Optional system prompt from runtime config
  const sys = (config.aiSystemPrompt || '').toString().trim();
  if (sys) messages.unshift({ role: 'system', content: sys });

  const upstream = await fetch(`${(config.aiBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.aiApiKey}`,
    },
    body: JSON.stringify({
      model: config.aiModel || 'gpt-4o-mini',
      messages,
      stream: false,
    }),
  });

  const json = await upstream.json().catch(() => ({} as any));
  if (!upstream.ok) {
    const msg = json?.error?.message || upstream.statusText || 'Upstream error';
    throw createError({ statusCode: upstream.status, statusMessage: msg });
  }

  const reply = json?.choices?.[0]?.message?.content ?? '';
  return { reply };
});









