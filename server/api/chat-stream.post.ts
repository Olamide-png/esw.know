// server/api/chat-stream.post.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  if (!config.aiApiKey) {
    // send one SSE error packet so your UI shows it
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: 'AI_API_KEY is missing' })}\n\n`));
        controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      },
    });
    return sendStream(event, stream);
  }

  const body = await readBody<{
    messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    q?: string;
    meta?: any;
  }>(event);

  let messages = body?.messages;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    const q = (body?.q || '').toString().trim();
    if (!q) {
      // same SSE error style
      const stream = new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ error: 'Missing messages or q' })}\n\n`));
          controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        },
      });
      return sendStream(event, stream);
    }
    messages = [{ role: 'user', content: q }];
  }

  const sys = (config.aiSystemPrompt || '').toString().trim();
  if (sys) messages.unshift({ role: 'system', content: sys });

  const url = `${(config.aiBaseUrl || 'https://api.openai.com/v1').replace(/\/$/, '')}/chat/completions`;

  const upstreamReq = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.aiApiKey}`,
    },
    body: JSON.stringify({
      model: config.aiModel || 'gpt-4o-mini',
      messages,
      stream: true,
    }),
  });

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: any) => controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

      try {
        const upstream = await upstreamReq;
        if (!upstream.ok) {
          let msg = upstream.statusText;
          try {
            const j = await upstream.json();
            msg = j?.error?.message || msg;
          } catch {}
          send({ error: msg });
          send({ done: true });
          controller.close();
          return;
        }

        if (!upstream.body) {
          send({ error: 'No upstream stream body' });
          send({ done: true });
          controller.close();
          return;
        }

        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const rawLine of chunk.split('\n')) {
            const line = rawLine.trim();
            if (!line.startsWith('data:')) continue;

            const payload = line.slice(5).trim();
            if (!payload) continue;
            if (payload === '[DONE]') {
              send({ done: true });
              controller.close();
              return;
            }

            // OpenAI-style stream chunk
            try {
              const json = JSON.parse(payload);
              const delta: string = json?.choices?.[0]?.delta?.content ?? '';
              if (delta) send({ token: delta });
            } catch {
              // Best-effort passthrough if provider sends plain text
              send({ token: payload });
            }
          }
        }

        send({ done: true });
        controller.close();
      } catch (err: any) {
        send({ error: err?.message || 'Stream error' });
        send({ done: true });
        controller.close();
      }
    },
  });

  // Proper SSE headers for Nitro
  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    // Vercel/Proxies: hint that this is a stream
    'X-Accel-Buffering': 'no',
  });

  return sendStream(event, stream);
});






