export function useAsk() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function ask({ query, limit, lang }: { query: string; limit?: number; lang?: string }) {
    pending.value = true
    error.value = null
    try {
      const res = await $fetch<any>('/api/nlweb/ask', {
        method: 'POST',
        body: { query, limit, lang }
      })
      const els = res?.itemListElement ?? []
      // Normalize to a list of Schema.org Things
      return els.map((e: any, i: number) => e?.item ?? e ?? { '@type': 'Thing', name: `Item ${i + 1}` })
    } catch (e: any) {
      error.value = e?.statusMessage || e?.message || 'Request failed'
      return []
    } finally {
      pending.value = false
    }
  }

  return { ask, pending, error }
}
