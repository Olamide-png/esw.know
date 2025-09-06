import { reactive, watch } from 'vue'

export function useGuideState(storageKey: string) {
  const state = reactive<{ done: Record<string, boolean> }>({ done: {} })

  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) Object.assign(state, JSON.parse(raw))
  } catch {}

  watch(state, (val) => {
    try { localStorage.setItem(storageKey, JSON.stringify(val)) } catch {}
  }, { deep: true })

  function toggle(id: string) {
    state.done[id] = !state.done[id]
  }
  function setAll(ids: string[], val: boolean) {
    ids.forEach(id => { state.done[id] = val })
  }
  function reset() {
    state.done = {}
  }

  return { state, toggle, setAll, reset }
}