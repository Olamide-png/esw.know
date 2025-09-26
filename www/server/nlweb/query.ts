// server/nlweb/query.ts
export const runtime = 'node' // force Node on Vercel

export default async function (input: any /* body */, event: any) {
  // TODO: do your real work here (OpenAI/RAG/etc.)
  // For now, return an echo so you can test end-to-end
  return { ok: true, route: 'nlweb/query', received: input }
}
