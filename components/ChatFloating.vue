<template>
  <!-- Floating Button -->
  <button
    :aria-expanded="isOpen ? 'true' : 'false'"
    aria-controls="nuxt-ai-chat"
    class="fixed bottom-4 right-6 md:right-8 z-50 inline-flex items-center gap-2 rounded-full border bg-background/90 dark:bg-neutral-900/90 backdrop-blur px-4 py-2 shadow-lg hover:shadow-xl transition focus:outline-none focus:ring focus:ring-primary"
    @click="toggle()"
  >
    <Icon name="lucide:message-circle" class="h-5 w-5" />
    <span class="hidden sm:inline">Ask AI</span>
  </button>

  <!-- Panel -->
  <transition name="chat-slide-fade">
    <section
      v-if="isOpen"
      id="nuxt-ai-chat"
      class="fixed bottom-20 right-6 md:right-8 z-50 w-[92vw] max-w-[420px] rounded-2xl border bg-background/95 dark:bg-neutral-900/95 backdrop-blur supports-[backdrop-filter]:bg-background/70 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col overflow-hidden"
      role="dialog"
      aria-label="AI assistant chat"
    >
      <!-- Header -->
      <header class="flex items-center justify-between px-4 py-3 border-b">
        <div class="flex items-center gap-2">
          <Icon name="lucide:sparkles" class="h-4 w-4" />
          <p class="font-medium">AI Assistant</p>
        </div>
        <div class="flex items-center gap-2">
          <button class="rounded-md p-1 hover:bg-muted" @click="clearChat()" title="Clear conversation">
            <Icon name="lucide:rotate-ccw" class="h-4 w-4" />
          </button>
          <button class="rounded-md p-1 hover:bg-muted" @click="toggle()" title="Close">
            <Icon name="lucide:x" class="h-4 w-4" />
          </button>
        </div>
      </header>

      <!-- Messages -->
      <div ref="scrollEl" class="flex-1 overflow-y-auto p-3 space-y-3">
        <MessageBubble
          v-for="(m, i) in messages"
          :key="i"
          :role="m.role"
          :content="m.content"
        />
        <div v-if="loading" class="flex items-start gap-2 text-sm opacity-80">
          <span class="mt-1"><Icon name="lucide:bot" class="h-5 w-5" /></span>
          <span class="animate-pulse">Thinking…</span>
        </div>
        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>
      </div>

      <!-- Input -->
      <form @submit.prevent="onSend" class="border-t p-3 bg-background/60">
        <div class="flex items-end gap-2">
          <textarea
            v-model="draft"
            rows="1"
            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
            class="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring focus:ring-primary/40"
            @keydown.enter.exact.prevent="onSend"
            @input="autoGrow"
            ref="taRef"
          ></textarea>
          <button
            type="submit"
            class="inline-flex items-center gap-2 rounded-lg border bg-primary text-primary-foreground px-3 py-2 text-sm shadow hover:shadow-md disabled:opacity-50"
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
import { ref, watch, onMounted, computed, nextTick } from 'vue'
import MessageBubble from '~/components/MessageBubble.vue'

/** Types */
interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }

/** Local storage keys + limits */
const STORAGE_KEY = 'ai:chat:history'
const STORAGE_OPEN = 'ai:chat:isOpen'
const MAX_HISTORY = 50
const MAX_INPUT_CHARS = 2000

/** State */
const isOpen = ref(false)
const messages = ref<ChatMessage[]>([])
const draft = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
const taRef = ref<HTMLTextAreaElement | null>(null)

/** Optional global bridge for “Ask this page” */
const chatOpen = useState<boolean>('chat:open', () => false)
const prefill = useState<string | null>('chat:prefill', () => null)
watch(chatOpen, v => { if (v && !isOpen.value) toggle() })
watch(prefill, v => {
  if (!v) return
  const text = normalizeInput(v)
  if (text) {
    messages.value.push({ role: 'user', content: text })
    trimHistory()
    saveHistory()
    onSend() // auto-send prefill
  }
  prefill.value = null
})

/** Helpers: sanitize + normalize user input */
function stripTags(s: string) {
  return s
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}
function normalizeInput(s: string, max = MAX_INPUT_CHARS) {
  return stripTags(s).replace(/\s+/g, ' ').trim().slice(0, max)
}

/** UI helpers */
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
  ta.style.height = Math.min(180, ta.scrollHeight) + 'px'
}

/** Persistence */
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
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) messages.value = JSON.parse(raw)
    const open = localStorage.getItem(STORAGE_OPEN)
    if (open) isOpen.value = JSON.parse(open)
  } catch {}
}

/** Send */
async function onSend() {
  if (!canSend.value || loading.value) return
  const text = normalizeInput(draft.value)
  if (!text) return
  draft.value = ''
  messages.value.push({ role: 'user', content: text })
  trimHistory()
  saveHistory()
  loading.value = true
  error.value = null

  try {
    const res = await $fetch<{ reply: string } | { error: string }>(
      '/api/chat',
      {
        method: 'POST',
        body: {
          messages: messages.value,
          meta: { client: 'nuxt-floating-chat', ts: Date.now() },
        },
      }
    )
    if ('error' in res) throw new Error(res.error)

    messages.value.push({ role: 'assistant', content: res.reply })
    trimHistory()
    saveHistory()
    requestAnimationFrame(() => {
      scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
    })
  } catch (e: any) {
    error.value = e?.message ?? 'Something went wrong.'
  } finally {
    loading.value = false
  }
}

/** Misc */
function clearChat() {
  messages.value = []
  saveHistory()
}
onMounted(loadHistory)
watch(messages, saveHistory, { deep: true })
</script>

<style scoped>
.chat-slide-fade-enter-active,
.chat-slide-fade-leave-active { transition: all .2s ease; }
.chat-slide-fade-enter-from { opacity: 0; transform: translateY(8px) scale(.98); }
.chat-slide-fade-leave-to { opacity: 0; transform: translateY(8px) scale(.98); }
</style>

