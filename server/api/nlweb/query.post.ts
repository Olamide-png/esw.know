export const runtime = 'node';

import { defineEventHandler, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ question?: string }>(event);
    // TODO: your real logic (OpenAI/RAG/etc.)
    return { ok: true, route: '/api/nlweb/query', received: body ?? null };
  } catch (err) {
    console.error('nlweb/query error:', err);
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Query failed' }));
  }
});

