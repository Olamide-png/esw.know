<template>
  <!-- Floating Button (hidden when panel is open) -->
  <button
    v-if="!isOpen"
    :aria-expanded="isOpen ? 'true' : 'false'"
    aria-controls="nuxt-ai-chat"
    class="fixed bottom-4 right-6 md:right-8 z-[1000]
           inline-flex items-center gap-2 rounded-full border
           bg-background/40 backdrop-blur-lg
           px-4 py-2 shadow-lg hover:shadow-xl transition
           focus:outline-none focus:ring focus:ring-primary/30"
    @click="toggle"
  >
    <Icon name="lucide:bot" class="h-5 w-5" />
    <span class="hidden sm:inline">Ask AI</span>
  </button>

  <!-- Panel (glassy + theme-aware) -->
  <transition name="chat-slide-fade">
    <section
      v-if="isOpen"
      id="nuxt-ai-chat"
      class="chat-panel fixed bottom-4 right-4 md:right-8 z-[1000] isolate
             w-[min(95vw,480px)] max-h-[80vh] md:max-h-[85vh]
             rounded-2xl border bg-background/25 backdrop-blur-md
             shadow-2xl ring-1 ring-black/5 dark:ring-white/10
             flex flex-col overflow-hidden"
      role="dialog"
      aria-label="AI assistant chat"
    >
      <!-- Header -->
      <header class="flex items-center justify-between px-4 py-3 border-b bg-background/20 backdrop-blur-md">
        <div class="flex items-center gap-2">
          <Icon name="lucide:sparkles" class="h-4 w-4" />
          <p class="font-medium">AI Assistant</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="hidden sm:inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs
                   bg-background/20 hover:bg-background/30"
            :class="useContext ? 'opacity-100' : 'opacity-70'"
            @click="useContext = !useContext"
            :title="useContext ? 'Using page context' : 'Click to use this page as context'"
          >
            <Icon name="lucide:file-text" class="h-3.5 w-3.5" />
            <span class="max-w-[12rem] truncate">{{ pageTitle || 'This page' }}</span>
            <span class="ml-1 rounded bg-muted/70 px-1.5 py-0.5 text-[10px]">
              {{ useContext ? 'ON' : 'OFF' }}
            </span>
          </button>

          <button class="rounded-md p-1 hover:bg-background/20" @click="clearChat" title="Clear conversation">
            <Icon name="lucide:rotate-ccw" class="h-4 w-4" />
          </button>
          <button class="rounded-md p-1 hover:bg-background/20" @click="toggle" title="Close">
            <Icon name="lucide:x" class="h-4 w-4" />
          </button>
        </div>
      </header>

      <!-- Messages -->
      <div
        ref="scrollEl"
        class="flex-1 overflow-y-auto overscroll-contain p-3 pr-4 space-y-3 bg-transparent"
      >
        <div v-if="useContext" class="mb-2">
          <span class="inline-flex items-center gap-1 text-[11px] rounded-md
                       bg-muted/60 border px-2 py-1">
            <Icon name="lucide:info" class="h-3.5 w-3.5" />
            <span>Answering from this page. ({{ contextChars }} chars)</span>
          </span>
        </div>

        <MessageBubble
          v-for="(m,i) in messages"
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
      <form @submit.prevent="onSend" class="shrink-0 border-t p-3 bg-background/35 backdrop-blur-lg">
        <div class="flex items-start gap-2">
          <textarea
            v-model="draft"
            rows="3"
            placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
            class="w-full resize-none rounded-lg border
                   bg-background/80 px-3 py-2 text-base leading-6 shadow-sm
                   focus:outline-none focus:ring focus:ring-primary/40
                   min-h-[3.5rem] md:min-h-[4rem] max-h-[45vh]"
            @keydown.enter.exact.prevent="onSend"
            @input="autoGrow"
            @paste="onPaste"
            ref="taRef"
          />
          <button
            type="submit"
            class="mt-1.5 inline-flex items-center gap-2 rounded-lg border
                   bg-primary/90 text-primary-foreground px-3 py-2 text-sm shadow hover:shadow-md disabled:opacity-50"
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
import { useRoute } from 'vue-router'
import MessageBubble from '~/components/MessageBubble.vue'

interface ChatMessage { role: 'system'|'user'|'assistant'; content: string }

const STORAGE_KEY = 'ai:chat:history'
const STORAGE_OPEN = 'ai:chat:isOpen'
const STORAGE_VER_KEY = 'ai:chat:ver'
const STORAGE_VER = '4' // bumped due to new context behavior

const MAX_HISTORY = 50
const MAX_INPUT_CHARS = 2000
const MAX_REPLY_CHARS = 1200

// Server clamps each message to CHAT_MAX_INPUT (default 1800). Keep context under this
// budget unless you increase CHAT_MAX_INPUT in env.
const CONTEXT_BUDGET = 1500

const isOpen = ref(false)
const messages = ref<ChatMessage[]>([])
const draft = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const scrollEl = ref<HTMLElement | null>(null)
const taRef = ref<HTMLTextAreaElement | null>(null)

const route = useRoute()

/* ✅ useContent() is client-safe in this layer */
const { page } = useContent()

/* ---------- page context ---------- */
const useContext = ref(true)
const pageTitle = ref('')
const pageText = ref('')
const contextChars = computed(() => pageText.value.length)

function stripTags(s: string) {
  return String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}
function normalizeInput(s: string, max = MAX_INPUT_CHARS) {
  return stripTags(s).replace(/\s+/g, ' ').trim().slice(0, max)
}
// preserve newlines for nicer markdown
function normalizeReply(s: string, max = MAX_REPLY_CHARS) {
  const noTags = String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
  const keepNewlines = noTags.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return keepNewlines.slice(0, max)
}
function looksLikeHtml(s: string) { return /<html|<head|<body|<script|window\.__NUXT__/i.test(String(s)) }

/* mdast -> plain text (Nuxt Content body) */
function mdastToText(node: any): string {
  if (!node) return ''
  const t = node.type
  if (t === 'text') return node.value || ''
  if (t === 'inlineCode') return '`' + (node.value || '') + '`'
  if (t === 'code') return '\n\n' + (node.value || '') + '\n\n'
  if (t === 'link' || t === 'emphasis' || t === 'strong' || t === 'delete' || t === 'span') {
    return (node.children || []).map(mdastToText).join('')
  }
  if (t === 'list') return '\n' + (node.children || []).map(mdastToText).join('\n') + '\n'
  if (t === 'listItem' || t === 'paragraph') return (node.children || []).map(mdastToText).join('') + '\n'
  if (t === 'heading' || t === 'blockquote') return '\n' + (node.children || []).map(mdastToText).join('') + '\n'
  if (t === 'table') return '\n' + (node.children || []).map(mdastToText).join('\n') + '\n'
  if (t === 'tableRow' || t === 'tableCell') return (node.children || []).map(mdastToText).join(' | ')
  if (t === 'image') return node.alt ? `[Image: ${node.alt}]` : ''
  if (Array.isArray(node)) return node.map(mdastToText).join('')
  if (t === 'root') return (node.children || []).map(mdastToText).join('')
  return ''
}

async function loadPageContext() {
  try {
    const doc: any = page?.value
    pageTitle.value = doc?.title || doc?.head?.title || 'This page'
    let text = ''
    if (doc?.body) text = mdastToText(doc.body)
    // Fallback: scrape DOM if body missing (rare)
    if (!text && typeof window !== 'undefined') {
      const el = document.querySelector('main, article, .prose') as HTMLElement | null
      if (el) text = el.innerText || ''
    }
    text = stripTags(text)
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    // keep within budget (server clamps anyway)
    pageText.value = text.slice(0, CONTEXT_BUDGET)
  } catch {
    pageTitle.value = 'This page'
    pageText.value = ''
  }
}

/* Refresh context when URL or content doc changes */
watch(() => route.fullPath, () => { loadPageContext() }, { immediate: true })
watch(page, () => { loadPageContext() })

/* ---------- ui ---------- */
const toggle = () => {
  isOpen.value = !isOpen.value
  localStorage.setItem(STORAGE_OPEN, JSON.stringify(isOpen.value))
  if (isOpen.value) nextTick(() => taRef.value?.focus())
}
const canSend = computed(() => normalizeInput(draft.value).length > 0)
function autoGrow() {
  const ta = taRef.value; if (!ta) return
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

/* ---------- streaming helper (now accepts payload messages) ---------- */
async function streamAnswer(payloadMessages: ChatMessage[]) {
  const res = await fetch('/api/chat-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: payloadMessages }),
  })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

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
            scrollEl.value?.scrollTo({ top: scrollEl.value!.scrollHeight })
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

/* ---------- send (stream with fallback), injecting page context ---------- */
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

  // Build payload messages: add a system instruction and include page context with the question
  const systemMsg: ChatMessage = {
    role: 'system',
    content:
      'You are a helpful docs assistant. Use ONLY the provided page content to answer. If the answer is not present, say you cannot find it on this page.',
  }
  const contextBlock =
    useContext.value && pageText.value
      ? `<<<PAGE_CONTENT_START>>>\n${pageText.value}\n<<<PAGE_CONTENT_END>>>`
      : '(No page content provided.)'

  const payloadMessages: ChatMessage[] = [
    systemMsg,
    // include prior turns (sanitized on server) so follow-ups work
    ...messages.value.map(m => ({ role: m.role, content: m.content })),
    // augment the latest user turn with the context block
    { role: 'user', content: `Question: ${text}\n\n${contextBlock}` },
  ]

  try {
    await streamAnswer(payloadMessages)
    trimHistory(); saveHistory()
  } catch (e: any) {
    // Fallback to non-streaming endpoint (e.g., if streaming 504s on Vercel)
    try {
      const res = await $fetch<{ reply: string } | { error: string }>('/api/chat', {
        method: 'POST',
        body: { messages: payloadMessages },
      })
      if ('error' in res) throw new Error(res.error)
      messages.value.push({ role: 'assistant', content: normalizeReply(res.reply) })
      trimHistory(); saveHistory()
      requestAnimationFrame(() => {
        scrollEl.value?.scrollTo({ top: scrollEl.value!.scrollHeight, behavior: 'smooth' })
      })
    } catch (e2: any) {
      error.value = e2?.message ?? e?.message ?? 'Something went wrong.'
    }
  } finally {
    loading.value = false
  }
}

/* ---------- actions ---------- */
function clearChat() { messages.value = []; saveHistory() }
function hardReset() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_OPEN)
  localStorage.setItem(STORAGE_VER_KEY, STORAGE_VER)
  location.reload()
}

/* Start taller & keep synced */
onMounted(() => {
  loadHistory()
  nextTick(() => autoGrow())
})
watch(draft, () => nextTick(() => autoGrow()))
watch(messages, saveHistory, { deep: true })
</script>

<style scoped>
.chat-slide-fade-enter-active,
.chat-slide-fade-leave-active { transition: all .2s ease; }
.chat-slide-fade-enter-from { opacity: 0; transform: translateY(8px) scale(.98); }
.chat-slide-fade-leave-to   { opacity: 0; transform: translateY(8px) scale(.98); }

.chat-panel { pointer-events: auto; }
</style>










