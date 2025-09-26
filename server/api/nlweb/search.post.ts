export const runtime = 'node';

import { defineEventHandler, readBody } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ q?: string }>(event);
    // TODO: your real search logic
    return { ok: true, route: '/api/nlweb/search', received: body ?? null };
  } catch (err) {
    console.error('nlweb/search error:', err);
    return sendError(event, createError({ statusCode: 500, statusMessage: 'Search failed' }));
  }
});

