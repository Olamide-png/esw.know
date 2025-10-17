// Simple health endpoint for Nitro/Nuxt
export default defineEventHandler(() => {
  return { ok: true, ts: new Date().toISOString() };
});
