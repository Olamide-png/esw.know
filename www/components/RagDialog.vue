<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { X, Wand2, Copy, Check, ExternalLink, Loader2 } from 'lucide-vue-next'
import MarkdownIt from 'markdown-it'
import footnote from 'markdown-it-footnote'
import linkAttrs from 'markdown-it-link-attributes'
import hljs from 'highlight.js'

const props = defineProps<{
  modelValue: boolean
  prefill?: string
  k?: number
  samples?: string[]
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const open = ref(props.modelValue)
watch(() => props.modelValue, v => (open.value = v))
watch(open, v => emit('update:modelValue', v))

const q = ref(props.prefill ?? '')
const streaming = ref(false)
const statusText = ref<string>('')                 // ← status from SSE (e.g. “broadening search…”)
const chunks = ref<string>('')                     // streamed answer text
const errorMsg = ref<string | null>(null)
const sources = ref<{ id: number | string; title: string; url?: string | null; score?: number }[]>([])
const copied = ref(false)

const defaultSamples = [
  'What are the ESW rounding rules?',
  'How do I enable localized front-end prices?',
  'Where do I configure shipping methods?',
  'Show an example of pricing models in v4.0'
]
const samples = computed(() => (props.samples?.length ? props.samples! : defaultSamples))

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight: (code, lang) => {
    try {
      if (lang && hljs.getLanguage(lang)) {
        const { value } = hljs.highlight(code, { language: lang })
        return `<pre class="hljs rounded-xl !bg-neutral-900 text-neutral-50 p-4 overflow-x-auto"><code>${value}</code></pre>`
      }
    } catch {}
    const escaped = md.utils.escapeHtml(code)
    return `<pre class="hljs rounded-xl !bg-neutral-900 text-neutral-50 p-4 overflow-x-auto"><code>${escaped}</code></pre>`
  }
})
  .use(footnote)
  .use(
    linkAttrs,
    { attrs: { class: 'underline decoration-dotted underline-offset-4 break-words whitespace-normal', target: '_blank', rel: 'noopener' } }
  )

const html = computed(() => md.render(chunks.value))

function fill(sample: string) {
  q.value = sample
  ask()
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    ask()
  } else if (e.key === 'Escape') {
    open.value = false
  }
}

async function ask() {
  const query = q.value.trim()
  if (!query) return

  streaming.value = true
  statusText.value = ''
  errorMsg.value = null
  chunks.value = ''
  sources.value = []
  copied.value = false

  try {
    const url = `/api/rag/chat/stream?q=${encodeURIComponent(query)}&k=${props.k ?? 8}`
    const res = await fetch(url, { headers: { Accept: 'text/event-stream' } })

    // Fallback to non-streaming JSON route
    if (!res.ok || !res.body) {
      const j = await $fetch<{ answer: string; sources: any[] }>('/api/rag/chat', {
        method: 'POST',
        body: { question: query, k: props.k ?? 8 }
      })
      chunks.value = j.answer || ''
      sources.value = j.sources || []
      streaming.value = false
      await nextTick()
      highlightAll()
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      for (const line of text.split('\n')) {
        if (!line.startsWith('data:')) continue
        const json = line.slice(5).trim()
        if (!json) continue
        const msg = JSON.parse(json)

        if (msg.type === 'status') {
          statusText.value = (msg.text || '').trim() // e.g. “broadening search…”
        } else if (msg.type === 'sources') {
          sources.value = msg.sources || []
        } else if (msg.type === 'delta') {
          chunks.value += msg.delta
        } else if (msg.type === 'done') {
          streaming.value = false
          statusText.value = ''
          await nextTick()
          highlightAll()
        }
      }
    }
  } catch (e: any) {
    errorMsg.value = e?.message || 'Request failed'
    streaming.value = false
    statusText.value = ''
  }
}

function highlightAll() {
  document.querySelectorAll('pre code').forEach(el => {
    try {
      hljs.highlightElement(el as HTMLElement)
    } catch {}
  })
}

async function copyAnswer() {
  try {
    await navigator.clipboard.writeText(chunks.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1200)
  } catch {}
}
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[1000] flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="open = false"
      >
        <!-- Dialog -->
        <div
          class="w-full max-w-3xl rounded-2xl bg-white/95 p-0 shadow-2xl dark:bg-neutral-900/95
                 ring-1 ring-black/5 dark:ring-white/10 max-h-[85vh] overflow-hidden"
          role="dialog"
          aria-modal="true"
        >
          <!-- Accent header -->
          <div class="relative h-1.5 w-full bg-gradient-to-r from-emerald-500 via-sky-500 to-fuchsia-500"></div>

          <div class="p-5">
            <!-- Header -->
            <div class="mb-2 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 min-w-0">
                <div
                  class="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-sky-500/20
                         text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/20"
                >
                  <Wand2 class="h-4 w-4" />
                </div>
                <h2 class="truncate text-lg font-semibold tracking-tight">Ask the docs</h2>
              </div>
              <button
                class="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                @click="open = false"
                aria-label="Close"
              >
                <X class="h-5 w-5" />
              </button>
            </div>

            <!-- Prompt -->
            <div
              class="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-900/70
                     shadow-sm"
            >
              <textarea
                v-model="q"
                @keydown="onKey"
                rows="3"
                placeholder="Ask anything about these docs… (Enter to ask, Shift+Enter for newline)"
                class="w-full resize-none rounded-2xl bg-transparent p-4 outline-none placeholder:text-neutral-400 dark:text-neutral-100"
                aria-label="Question"
              />
            </div>

            <!-- Status + Controls -->
            <div class="mt-3 flex flex-wrap items-center gap-3">
              <!-- Status badges -->
              <div class="flex items-center gap-2 min-h-[28px]">
                <span
                  v-if="statusText"
                  class="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 dark:border-neutral-800/80
                         bg-white/70 dark:bg-neutral-900/70 px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-300"
                >
                  <span class="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"></span>
                  {{ statusText }}
                </span>

                <span
                  v-else-if="streaming"
                  class="inline-flex items-center gap-2 rounded-full border border-neutral-200/80 dark:border-neutral-800/80
                         bg-white/70 dark:bg-neutral-900/70 px-2.5 py-1 text-xs text-neutral-600 dark:text-neutral-300"
                >
                  <Loader2 class="h-3.5 w-3.5 animate-spin" />
                  answering…
                </span>
              </div>

              <div class="ml-auto flex items-center gap-2">
                <button
                  class="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-white
                         dark:bg-white dark:text-neutral-900 disabled:opacity-60 focus:outline-none
                         focus:ring-2 focus:ring-emerald-500/40"
                  :disabled="!q.trim().length || streaming"
                  @click="ask"
                >
                  <span v-if="!streaming">Ask</span>
                  <span v-else class="inline-flex items-center gap-2">
                    <Loader2 class="h-4 w-4 animate-spin" /> Ask
                  </span>
                </button>
              </div>
            </div>

            <!-- Samples -->
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-for="s in samples"
                :key="s"
                class="truncate rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-700
                       hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300
                       dark:hover:bg-neutral-800"
                @click="fill(s)"
              >
                {{ s }}
              </button>
            </div>

            <!-- Content grid -->
            <div class="mt-4 grid min-w-0 gap-4 overflow-auto pr-1 md:grid-cols-12">
              <!-- Answer -->
              <section class="min-w-0 md:col-span-8">
                <div
                  class="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70
                         shadow-sm overflow-hidden"
                >
                  <header class="mb-3 flex items-center justify-between p-4 pb-0">
                    <span class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Answer</span>
                    <button
                      @click="copyAnswer"
                      class="flex items-center gap-1 rounded-lg px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800
                             focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <Copy v-if="!copied" class="h-4 w-4" />
                      <Check v-else class="h-4 w-4 text-emerald-500" />
                      <span>{{ copied ? 'Copied' : 'Copy' }}</span>
                    </button>
                  </header>

                  <div class="p-4 pt-2">
                    <p
                      v-if="errorMsg"
                      class="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"
                    >
                      {{ errorMsg }}
                    </p>

                    <article
                      class="prose prose-neutral dark:prose-invert max-w-none
                             prose-a:decoration-dotted prose-a:underline-offset-4
                             prose-pre:shadow-inner prose-code:before:content-[''] prose-code:after:content-['']
                             break-words whitespace-normal hyphens-auto"
                      v-html="html"
                      aria-live="polite"
                    />
                  </div>
                </div>
              </section>

              <!-- Sources -->
              <aside class="min-w-0 md:col-span-4">
                <div
                  class="rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white/70 dark:bg-neutral-950/70
                         shadow-sm"
                >
                  <div class="mb-2 px-4 pt-4 text-sm font-medium text-neutral-500 dark:text-neutral-400">Sources</div>
                  <ol class="max-h-[60vh] space-y-2 overflow-y-auto px-4 pb-4 pr-1">
                    <li
                      v-for="(s, i) in sources"
                      :key="s.id"
                      class="rounded-lg border border-dashed border-neutral-200 p-2 break-words dark:border-neutral-800"
                    >
                      <div class="flex min-w-0 items-start gap-2">
                        <span class="shrink-0 font-mono text-xs text-neutral-500">[#{{ i + 1 }}]</span>
                        <div class="min-w-0">
                          <a
                            v-if="s.url"
                            :href="s.url"
                            target="_blank"
                            class="inline-flex items-start gap-1 underline decoration-dotted break-words whitespace-normal"
                          >
                            <ExternalLink class="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-70" />
                            <span class="block min-w-0 break-words whitespace-normal">
                              {{ s.title }}
                            </span>
                          </a>
                          <span v-else class="block min-w-0 break-words whitespace-normal">{{ s.title }}</span>
                          <div v-if="s.score !== undefined" class="mt-0.5 text-[10px] text-neutral-400">
                            score: {{ (s.score * 100).toFixed(0) }}
                          </div>
                        </div>
                      </div>
                    </li>
                  </ol>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.hljs {
  background: transparent;
}
</style>


