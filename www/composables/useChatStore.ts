// composables/useChatStore.ts
import { ref, computed, watch } from 'vue'

export type Role = 'system' | 'user' | 'assistant'
export interface ChatMessage { role: Role; content: string }
export interface Thread {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

const STORAGE = 'ai:threads:v1'

function uid() {
  return (globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)) + Date.now()
}

function stripTags(s: string) {
  return String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}

function normalizeReply(s: string) {
  const noTags = stripTags(s)
  return noTags.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
}

export function useChatStore() {
  const threads = ref<Thread[]>([])
  const currentId = ref<string>('')

  // ---- load/save ------------------------------------------------------------
  function save() {
    localStorage.setItem(STORAGE, JSON.stringify({ threads: threads.value, currentId: currentId.value }))
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE)
      if (raw) {
        const data = JSON.parse(raw)
        threads.value = Array.isArray(data?.threads) ? data.threads : []
        currentId.value = data?.currentId || ''
      }
    } catch {}
    if (!threads.value.length) newThread()
    if (!currentId.value) currentId.value = threads.value[0].id
  }
  if (process.client && threads.value.length === 0) load()
  watch([threads, currentId], save, { deep: true })

  const current = computed<Thread | null>(() => threads.value.find(t => t.id === currentId.value) || null)

  // ---- thread actions -------------------------------------------------------
  function newThread() {
    const t: Thread = {
      id: uid(),
      title: 'New chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    threads.value.unshift(t)
    currentId.value = t.id
    save()
    return t.id
  }
  function selectThread(id: string) {
    currentId.value = id
  }
  function deleteThread(id: string) {
    const i = threads.value.findIndex(t => t.id === id)
    if (i >= 0) threads.value.splice(i, 1)
    if (!threads.value.length) newThread()
    if (!threads.value.find(t => t.id === currentId.value)) currentId.value = threads.value[0].id
  }
  function touch(t: Thread) { t.updatedAt = Date.now() }

  // ---- chatting (stream with fallback) -------------------------------------
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function send(text: string) {
    const t = current.value
    if (!t || !text.trim() || loading.value) return
    error.value = null
    t.messages.push({ role: 'user', content: text.trim() })
    if (t.title === 'New chat') t.title = text.trim().slice(0, 48)
    touch(t); save()

    loading.value = true
    try {
      await stream(t)
    } catch (e: any) {
      // fallback
      try {
        const res = await $fetch<{ reply: string } | { error: string }>('/api/chat', {
          method: 'POST',
          body: { messages: t.messages },
        })
        if ('error' in res) throw new Error(res.error)
        t.messages.push({ role: 'assistant', content: normalizeReply(res.reply) })
        touch(t); save()
      } catch (e2: any) {
        error.value = e2?.message ?? e?.message ?? 'Something went wrong.'
      }
    } finally {
      loading.value = false
    }
  }

  async function stream(t: Thread) {
    const res = await fetch('/api/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: t.messages }),
    })
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

    // create an empty assistant message to fill
    t.messages.push({ role: 'assistant', content: '' })
    const idx = t.messages.length - 1

    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const parts = buf.split('\n\n')
      buf = parts.pop() || ''
      for (const part of parts) {
        const line = part.trim()
        if (!line.startsWith('data:')) continue
        const json = line.slice(5).trim()
        if (!json) continue
        try {
          const evt = JSON.parse(json)
          if (evt.token) {
            t.messages[idx].content += stripTags(String(evt.token))
            touch(t)
          }
          if (evt.error) throw new Error(evt.error)
          if (evt.done) {
            t.messages[idx].content = normalizeReply(t.messages[idx].content)
            touch(t); save()
            return
          }
        } catch { /* ignore */ }
      }
      save()
    }
  }

  return {
    // state
    threads, current, currentId, loading, error,
    // actions
    newThread, selectThread, deleteThread, send,
  }
}
