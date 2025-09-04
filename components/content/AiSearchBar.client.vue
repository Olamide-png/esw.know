<template>
  <div class="relative w-full max-w-3xl">
    <!-- INPUT -->
    <form @submit.prevent="onAsk" class="relative">
      <div
        class="flex items-center gap-2 rounded-xl border bg-background px-3 py-2 shadow-sm focus-within:ring focus-within:ring-primary/40"
      >
        <Icon name="lucide:bot" class="w-5 h-5 opacity-80" />
        <input
          ref="inputRef"
          v-model="query"
          :placeholder="placeholder"
          :disabled="loading"
          class="w-full bg-transparent outline-none text-base"
          aria-label="Ask AI"
        />
        <button
          type="submit"
          class="inline-flex items-center gap-2 rounded-md border bg-primary text-primary-foreground px-3 py-1.5 text-sm shadow hover:shadow-md disabled:opacity-50"
          :disabled="loading || !canSend"
        >
          <Icon v-if="!loading" name="lucide:send" class="w-4 h-4" />
          <Icon v-else name="lucide:loader-2" class="w-4 h-4 animate-spin" />
          <span class="hidden sm:inline">{{ loading ? 'Asking…' : 'Ask' }}</span>
        </button>
      </div>
    </form>

    <!-- RESULT PANEL -->
    <transition name="fade">
      <div
        v-if="answer || error || loading"
        class="mt-3 rounded-xl border bg-background/95 backdrop-blur p-3 shadow-md"
      >
        <!-- toolbar -->
        <div class="mb-2 flex items-center gap-2 text-xs">
          <span class="font-medium">Answer</span>
          <span v-if="loading" class="opacity-70">• streaming…</span>
          <span class="ml-auto"></span>

          <button v-if="loading" class="rounded border px-2 py-1 hover:bg-muted" @click="stop">
            <Icon name="lucide:square" class="w-3.5 h-3.5" />
            Stop
          </button>

          <button
            v-if="answer"
            class="rounded border px-2 py-1 hover:bg-muted"
            @click="copyAnswer"
            title="Copy answer"
          >
            <Icon name="lucide:copy" class="w-3.5 h-3.5" />
            Copy
          </button>

          <NuxtLink
            v-if="query"
            :to="`/chat?q=${encodeURIComponent(query)}`"
            target="_blank"
            rel="noopener"
            class="rounded border px-2 py-1 hover:bg-muted inline-flex items-center gap-1"
            title="Open in full chat"
          >
            <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
            Open in Chat
          </NuxtLink>

          <button class="rounded border px-2 py-1 hover:bg-muted" @click="clearAll" title="Clear">
            <Icon name="lucide:rotate-ccw" class="w-3.5 h-3.5" />
            Clear
          </button>
        </div>

        <!-- content -->
        <div class="prose prose-sm dark:prose-invert max-w-none">
          <div v-if="error" class="text-red-600 dark:text-red-400 text-sm whitespace-pre-wrap">
            {{ error }}
          </div>
          <div v-else v-html="html" class="break-words" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

/* Give MDC a nice kebab-case name: ::ai-search-bar … :: */
defineOptions({ name: 'AiSearchBar' })

/* ---------- Props ---------- */
const props = defineProps<{
  placeholder?: string
  system?: string
}>()

const placeholder = computed(() => props.placeholder || 'Ask anything…')

/* ---------- State ---------- */
const query = ref('')
const answer = ref('')
const loading = ref(false)
const error = ref<string | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
let aborter: AbortController | null = null

const MAX_INPUT = 1800
const MAX_REPLY = 8000

/* ---------- Sanitizers ---------- */
function stripTags(s: string) {
  return String(s ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
}
function normalizeInput(s: string) {
  return stripTags(s).replace(/\s+/g, ' ').trim().slice(0, MAX_INPUT)
}
function normalizeReply(s: string) {
  const noTags = stripTags(s)
  return noTags
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_REPLY)
}

/* ---------- Tiny Markdown (no deps) ---------- */
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function renderMarkdownSafe(md: string): string {
  if (!md) return ''
  let txt = escapeHtml(md)

  // code blocks
  const codeBlocks: string[] = []
  txt = txt.replace(/```([\s\S]*?)```/g, (_m, code) => {
    const i = codeBlocks.push(
      `<pre class="block overflow-x-auto overflow-y-hidden rounded-md bg-black/80 text-white p-3 text-[12px] leading-5"><code>${escapeHtml(code)}</code></pre>`
    ) - 1
    return `@@CB${i}@@`
  })
  // inline code
  txt = txt.replace(/`([^`]+)`/g, (_m, g1) => `<code class="rounded bg-black/10 px-1 py-0.5 text-[12px]">${escapeHtml(g1)}</code>`)
  // headings
  for (let i = 6; i >= 1; i--) {
    const re = new RegExp(`^${'#'.repeat(i)}\\s+(.+)$`, 'gm')
    const sz = ['text-2xl','text-xl','text-lg','text-base','text-sm','text-xs'][i-1]
    txt = txt.replace(re, (_m, g1) => `<h${i} class="font-semibold ${sz} mt-2 mb-1">${g1.trim()}</h${i}>`)
  }
  // links
  txt = txt.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, label, url) =>
    `<a href="${url}" target="_blank" rel="nofollow noopener" class="underline">${label}</a>`
  )
  // bold / italic
  txt = txt.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  txt = txt.replace(/(^|[\s_])\*([^*\n]+)\*(?=[\s_]|$)/g, '$1<em>$2</em>')
  // lists
  txt = txt.replace(/(?:^|\n)([-*+] .+(?:\n[-*+] .+)*)/g, (block) => {
    const items = block.trim().split('\n').map(l => l.replace(/^[-*+]\s+/, '').trim())
    if (items.length < 2) return block
    return `\n<ul class="list-disc pl-5 my-2">${items.map(li => `<li>${li}</li>`).join('')}</ul>`
  })
  txt = txt.replace(/(?:^|\n)((?:\d+\. .+(?:\n))+)/g, (block) => {
    const items = block.trim().split('\n').map(l => l.replace(/^\d+\.\s+/, '').trim())
    if (items.length < 2) return block
    return `\n<ol class="list-decimal pl-5 my-2">${items.map(li => `<li>${li}</li>`).join('')}</ol>`
  })
  // paragraphs
  txt = txt.split(/\n{2,}/).map(part => {
    if (/^<(h[1-6]|ul|ol|pre|blockquote)/.test(part.trim())) return part
    return `<p class="my-2">${part.replace(/\n/g, '<br/>')}</p>`
  }).join('')

  // restore code blocks
  txt = txt.replace(/@@CB(\d+)@@/g, (_m, i) => codeBlocks[Number(i)] || '')
  return txt
}
const html = computed(() => renderMarkdownSafe(answer.value))

/* ---------- Derived ---------- */
const canSend = computed(() => !!normalizeInput(query.value))

/* ---------- Actions ---------- */
function focusInput() { inputRef.value?.focus() }
function clearAll() { stop(); answer.value = ''; error.value = null; query.value = ''; focusInput() }
async function copyAnswer() {
  try { await navigator.clipboard.writeText(answer.value || '') } catch {}
}

/* Streaming with fallback */
async function onAsk() {
  const text = normalizeInput(query.value)
  if (!text || loading.value) return
  answer.value = ''
  error.value = null
  loading.value = true

  // Build messages (single-turn; add optional system if provided)
  const messages: Array<{ role: 'system'|'user'|'assistant'; content: string }> = []
  if (props.system) messages.push({ role: 'system', content: stripTags(props.system) })
  messages.push({ role: 'user', content: text })

  try {
    await stream(messages)
  } catch (e: any) {
    // Fallback to non-streaming
    try {
      const res = await $fetch<{ reply: string } | { error: string }>('/api/chat', {
        method: 'POST',
        body: { messages }
      })
      if ('error' in res) throw new Error(res.error)
      answer.value = normalizeReply(res.reply)
    } catch (e2: any) {
      error.value = e2?.message ?? e?.message ?? 'Something went wrong.'
    }
  } finally {
    loading.value = false
  }
}

async function stream(messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>) {
  aborter?.abort()
  aborter = new AbortController()

  const res = await fetch('/api/chat-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: aborter.signal
  })
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

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
          answer.value += token
          if (answer.value.length > MAX_REPLY) {
            answer.value = answer.value.slice(0, MAX_REPLY)
            stop()
            return
          }
        }
        if (evt.error) throw new Error(evt.error)
        if (evt.done) {
          answer.value = normalizeReply(answer.value)
          return
        }
      } catch { /* ignore malformed chunk */ }
    }
  }
}

function stop() {
  if (aborter) {
    aborter.abort()
    aborter = null
    loading.value = false
  }
}

/* ---------- Hotkey (Ctrl/⌘+K to focus) ---------- */
function onKey(e: KeyboardEvent) {
  const isMac = navigator.platform.toLowerCase().includes('mac')
  if ((isMac && e.metaKey && e.key.toLowerCase() === 'k') || (!isMac && e.ctrlKey && e.key.toLowerCase() === 'k')) {
    e.preventDefault()
    focusInput()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
:deep(pre) { max-width: 100%; }
:deep(code) { word-break: break-word; }
</style>



