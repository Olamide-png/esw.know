// composables/useNlweb.ts
type NLWebAskParams = {
  query: string
  // You can add other NLWeb parameters you plan to use here (filters, source hints, topK, etc.)
  [k: string]: any
}

type SchemaThing = Record<string, any>

export function useNlweb() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function ask(params: NLWebAskParams): Promise<SchemaThing[]> {
    pending.value = true
    error.value = null
    try {
      const res = await $fetch<any>('/api/nlweb/ask', { method: 'POST', body: params })

      // Normalize common shapes:
      // 1) { "@type": "ItemList", "itemListElement": [...] }
      // 2) { items: [...] }
      // 3) a single Thing object
      if (res?.itemListElement && Array.isArray(res.itemListElement)) {
        return res.itemListElement.map((x: any) => x.item || x)
      }
      if (Array.isArray(res?.items)) return res.items
      if (Array.isArray(res)) return res
      if (res && typeof res === 'object') return [res]
      return []
    } catch (e: any) {
      error.value = e?.statusMessage || e?.message || 'Request failed'
      return []
    } finally {
      pending.value = false
    }
  }

  return { ask, pending, error }
}
