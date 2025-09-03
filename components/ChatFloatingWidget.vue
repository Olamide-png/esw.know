<template>
  <!-- Floating Button -->
  <button
    :aria-expanded="isOpen ? 'true' : 'false'"
    aria-controls="nuxt-ai-chat"
    class="fixed bottom-4 right-6 md:right-8 z-50 inline-flex items-center gap-2 rounded-full border bg-background/90 dark:bg-neutral-900/90 backdrop-blur px-4 py-2 shadow-lg hover:shadow-xl transition focus:outline-none focus:ring focus:ring-primary"
    @click="toggle"
  >
    <Icon name="lucide:bot" class="h-5 w-5" class="h-6 w-6" />
    <span class="hidden sm:inline">Ask AI</span>
  </button>

  <!-- Panel -->
  <transition name="chat-slide-fade">
    <section
      v-if="isOpen"
      id="nuxt-ai-chat"
      class="fixed bottom-20 right-6 md:right-8 z-50 w-[92vw] max-w-[420px]
             max-h-[85vh] min-h-0 rounded-2xl border bg-background/95 dark:bg-neutral-900/95
             backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-2xl
             ring-1 ring-black/5 dark:ring-white/10 flex flex-col overflow-hidden"
      role="dialog"
      aria-label="AI assistant chat"
    >
      <header class="shrink-0 flex items-center justify-between px-4 py-3 border-b">
        <div class="flex items-center gap-2">
          <Icon name="lucide:sparkles" class="h-4 w-4" />
          <p class="font-medium">AI Assistant</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="rounded-md p-1 hover:bg-muted" @click="hardReset" title="Hard reset (clear storage)">
            <Icon name="lucide:trash-2" class="h-4 w-4" />
          </button>
          <button class="rounded-md p-1 hover:bg-muted" @click="clearChat" title="Clear conversation">
            <Icon name="lucide:rotate-ccw" class="h-4 w-4" />
          </button>
          <button class="rounded-md p-1 hover:bg-muted" @click="toggle" title="Close">
            <Icon name="lucide:x" class="h-4 w-4" />
          </button>
        </div>
      </header>

      <div
        ref="scrollEl"
        class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-3"
      >
        <MessageBubble v-for="(m,i) in messages" :key="i" :role="m.role" :content="m.content" />
        <div v-if="loading" class="flex items-start gap-2 text-sm opacity-80">
          <span class="mt-1"><Icon name="lucide:bot" class="h-5 w-5" /></span>
          <span class="animate-pulse">Thinking…</span>
        </div>
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      </div>

      <!-- Bigger, auto-growing input -->
      <form @submit.prevent="onSend" class="shrink-0 border-t p-3 bg-background/60">
        <div class="flex items-start gap-2">
          <textarea
            v-model="draft"
            rows="3"
            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
            class="w-full resize-none rounded-lg border bg-background px-3 py-2 text-base leading-6 shadow-sm focus:outline-none focus:ring focus:ring-primary/40
                   min-h-[3.5rem] md:min-h-[4rem] max-h-[50vh]"
            @keydown.enter.exact.prevent="onSend"
            @input="autoGrow"
            @paste="onPaste"
            ref="taRef"
          ></textarea>
          <button
            type="submit"
            class="mt-1.5 inline-flex items-center gap-2 rounded-lg border bg-primary text-primary-foreground px-3 py-2 text-sm shadow hover:shadow-md disabled:opacity-50"
            :disabled="loading || !canSend"
          >
            <Icon name="lucide:send" class="h-4 w-4" />
            <span class="sr-only sm:not-sr-only">Send</span>
          </button>
        </div>
      </form>
    </section>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed, nextTick } from 'vue'
import MessageBubble from '~/components/MessageBubble.vue'

interface ChatMessage { role: 'system'|'user'|'assistant'; content: string }

const STORAGE_KEY = 'ai:chat:history'
const STORAGE_OPEN = 'ai:chat:isOpen'
const STORAGE_VER_KEY = 'ai:chat:ver'
const STORAGE_VER = '3'

const MAX_HISTORY = 50
const MAX_INPUT_CHARS = 2000
const MAX_REPLY_CHARS = 1200

const isOpen = ref(false)
const messages = ref<ChatMessage[]>([])
const draft = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
const taRef = ref<HTMLTextAreaElement | null>(null)

/* ---------- sanitation ---------- */
function stripTags(s: string) {
  return String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}
function normalizeInput(s: string, max = MAX_INPUT_CHARS) {
  return stripTags(s).replace(/\s+/g, ' ').trim().slice(0, max)
}
// preserve line breaks for markdown
function normalizeReply(s: string, max = MAX_REPLY_CHARS) {
  const noTags = String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
  const keepNewlines = noTags
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return keepNewlines.slice(0, max)
}
function looksLikeHtml(s: string) {
  return /<html|<head|<body|<script|window\.__NUXT__/i.test(String(s))
}

/* ---------- ui ---------- */
const toggle = () => {
  isOpen.value = !isOpen.value
  localStorage.setItem(STORAGE_OPEN, JSON.stringify(isOpen.value))
  if (isOpen.value) nextTick(() => taRef.value?.focus())
}
const canSend = computed(() => normalizeInput(draft.value).length > 0)

function autoGrow() {
  const ta = taRef.value
  if (!ta) return
  ta.style.height = 'auto'
  const max = Math.max(200, Math.round(window.innerHeight * 0.5))
  ta.style.height = Math.min(max, ta.scrollHeight) + 'px'
}
function onPaste(e: ClipboardEvent) {
  const dt = e.clipboardData; if (!dt) return
  const html = dt.getData('text/html')
  if (html) {
    e.preventDefault()
    const plain = dt.getData('text/plain') || stripTags(html)
    const normalized = normalizeInput(plain)
    draft.value = (draft.value ? draft.value + ' ' : '') + normalized
    nextTick(autoGrow)
  }
}

/* ---------- persistence ---------- */
function trimHistory() {
  if (messages.value.length > MAX_HISTORY) {
    messages.value.splice(0, messages.value.length - MAX_HISTORY)
  }
}
function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value))
}
function loadHistory() {
  try {
    const ver = localStorage.getItem(STORAGE_VER_KEY)
    if (ver !== STORAGE_VER) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.setItem(STORAGE_VER_KEY, STORAGE_VER)
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed: ChatMessage[] = JSON.parse(raw)
      const hasBlob = parsed.some(m => (m?.content?.length ?? 0) > 50000 || looksLikeHtml(m?.content || ''))
      messages.value = hasBlob ? [] : parsed
    }
    const open = localStorage.getItem(STORAGE_OPEN)
    if (open) isOpen.value = JSON.parse(open)
  } catch {
    localStorage.removeItem(STORAGE_KEY)
  }
}

/* ---------- streaming helper ---------- */
async function streamAnswer() {
  const res = await fetch('/api/chat-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages.value }),
  })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  // create empty assistant bubble to append into
  messages.value.push({ role: 'assistant', content: '' })
  const idx = messages.value.length - 1

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    const parts = buffer.split('\n\n')
    buffer = parts.pop() || ''
    for (const p of parts) {
      const line = p.trim()
      if (!line.startsWith('data:')) continue
      const jsonStr = line.slice(5).trim()
      if (!jsonStr) continue
      try {
        const evt = JSON.parse(jsonStr)
        if (evt.token) {
          const token = stripTags(String(evt.token))
          messages.value[idx].content += token
          saveHistory()
          requestAnimationFrame(() => {
            scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight })
          })
        }
        if (evt.error) throw new Error(evt.error)
        if (evt.done) {
          messages.value[idx].content = normalizeReply(messages.value[idx].content)
          saveHistory()
          return
        }
      } catch { /* ignore malformed chunk */ }
    }
  }
}

/* ---------- send (stream with fallback) ---------- */
async function onSend() {
  if (!canSend.value || loading.value) return
  const raw = draft.value
  const text = normalizeInput(raw)
  if (!text) {
    error.value = looksLikeHtml(raw)
      ? 'It looks like you pasted raw HTML. Please paste text excerpts or type a question.'
      : 'Please type a message.'
    return
  }

  draft.value = ''
  messages.value.push({ role: 'user', content: text })
  trimHistory(); saveHistory()
  loading.value = true; error.value = null

  try {
    await streamAnswer()
    trimHistory(); saveHistory()
  } catch (e: any) {
    try {
      const res = await $fetch<{ reply: string } | { error: string }>('/api/chat', {
        method: 'POST',
        body: { messages: messages.value },
      })
      if ('error' in res) throw new Error(res.error)
      messages.value.push({ role: 'assistant', content: normalizeReply(res.reply) })
      trimHistory(); saveHistory()
      requestAnimationFrame(() => {
        scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
      })
    } catch (e2: any) {
      error.value = e2?.message ?? e?.message ?? 'Something went wrong.'
    }
  } finally {
    loading.value = false
  }
}

/* ---------- actions ---------- */
function clearChat() {
  messages.value = []; saveHistory()
}
function hardReset() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_OPEN)
  localStorage.setItem(STORAGE_VER_KEY, STORAGE_VER)
  location.reload()
}

/* Start taller & keep synced + Esc to close */
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape' && isOpen.value) toggle()
}
onMounted(() => {
  loadHistory()
  nextTick(() => autoGrow())
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => window.removeEventListener('keydown', onKey))
watch(draft, () => nextTick(() => autoGrow()))
watch(messages, saveHistory, { deep: true })
</script>

<style scoped>
.chat-slide-fade-enter-active,
.chat-slide-fade-leave-active { transition: all .2s ease; }
.chat-slide-fade-enter-from { opacity: 0; transform: translateY(8px) scale(.98); }
.chat-slide-fade-leave-to { opacity: 0; transform: translateY(8px) scale(.98); }
</style>








