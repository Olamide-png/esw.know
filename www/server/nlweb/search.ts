// server/nlweb/search.ts
export const runtime = 'node' // force Node on Vercel

export default async function (input: any, event: any) {
  // TODO: implement your search logic (vector DB, etc.)
  return { ok: true, route: 'nlweb/search', received: input }
}
