<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

type SnippetMap = Record<string, string>

const props = withDefaults(defineProps<{
  title?: string
  kind?: 'request' | 'response'
  snippets?: SnippetMap                 // for request blocks: language -> code
  languageOrder?: string[]              // order of languages in dropdown
  initialLanguage?: string
  monospace?: boolean
  wrap?: boolean
  // Response-only configurable controls:
  copySettings?: { label?: string; tooltip?: string }
  expandSettings?: { label?: string; tooltip?: string }
  collapseSettings?: { label?: string; tooltip?: string }
  // Optional small header tag (e.g., "PATCH /special-events/{eventId}")
  badge?: string
}>(), {
  title: '',
  kind: 'request',
  snippets: () => ({}),
  languageOrder: () => ['curl', 'javascript', 'python', 'php'],
  initialLanguage: 'curl',
  monospace: true,
  wrap: false,
  copySettings: () => ({ label: 'Copy', tooltip: 'Copy code to clipboard' }),
  expandSettings: () => ({ label: 'Expand', tooltip: 'Expand code' }),
  collapseSettings: () => ({ label: 'Collapse', tooltip: 'Collapse code' }),
  badge: ''
})

const open = ref(false)           // expand/collapse state
const currentLang = ref(props.initialLanguage)
const code = computed(() => props.snippets[currentLang.value] ?? '')
const isResponse = computed(() => props.kind === 'response')

// decorative language icons (swap to Nuxt Icon or lucide if you like)
const langIcon = (lang: string) => ({
  curl: '🌐', javascript: '🟨', python: '🐍', php: '🐘', java: '☕', ruby: '💎', go: '🌀'
}[lang] || '📄')

async function copyCode() {
  try {
    await navigator.clipboard.writeText(code.value)
    showCopied.value = true
    setTimeout(() => (showCopied.value = false), 1200)
  } catch {}
}
const showCopied = ref(false)

const container = ref<HTMLElement | null>(null)
onMounted(() => {
  // optional: auto-size initially based on lines
  if (container.value && !open.value) {
    const max = 320 // px
    if (container.value.scrollHeight > max) container.value.style.maxHeight = max + 'px'
  }
})
</script>

<template>
  <div class="group relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/60 shadow-sm overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between gap-2 px-3 py-2 border-b border-neutral-200/70 dark:border-neutral-800/70 bg-neutral-50/70 dark:bg-neutral-900/40">
      <div class="min-w-0 flex items-center gap-2">
        <span v-if="badge" class="inline-flex items-center rounded-md bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2 py-0.5 text-xs font-medium">
          {{ badge }}
        </span>
        <h3 class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {{ title || (isResponse ? 'Response' : 'Request') }}
        </h3>
      </div>

      <!-- Controls -->
      <div class="flex items-center gap-1">
        <!-- Language dropdown (request + response both can show it if snippets > 1) -->
        <div v-if="Object.keys(snippets).length > 1" class="relative">
          <details class="open:shadow-inner [&_summary::-webkit-details-marker]:hidden">
            <summary class="flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer">
              <span class="select-none">{{ langIcon(currentLang) }}</span>
              <span class="select-none capitalize">{{ currentLang }}</span>
              <svg class="h-3 w-3 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/></svg>
            </summary>
            <ul class="absolute right-0 mt-1 w-40 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 py-1 z-10">
              <li v-for="lang in languageOrder" :key="lang">
                <button
                  type="button"
                  @click="currentLang = lang"
                  class="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  <span>{{ langIcon(lang) }}</span>
                  <span class="capitalize">{{ lang }}</span>
                </button>
              </li>
            </ul>
          </details>
        </div>

        <!-- Copy -->
        <button
          :title="copySettings.tooltip || 'Copy'"
          class="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
          @click="copyCode"
        >
          {{ showCopied ? 'Copied' : (copySettings.label || 'Copy') }}
        </button>

        <!-- Expand / Collapse -->
        <button
          v-if="!open"
          :title="expandSettings.tooltip || 'Expand'"
          class="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
          @click="open = true; container && (container.style.maxHeight = 'none')"
        >
          {{ expandSettings.label || 'Expand' }}
        </button>
        <button
          v-else
          :title="collapseSettings.tooltip || 'Collapse'"
          class="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
          @click="open = false; container && (container.style.maxHeight = '320px')"
        >
          {{ collapseSettings.label || 'Collapse' }}
        </button>
      </div>
    </div>

    <!-- Code -->
    <pre
      ref="container"
      class="relative m-0 max-h-[320px] overflow-auto p-4 text-xs leading-relaxed"
      :class="[
        monospace ? 'font-mono' : 'font-sans',
        wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre',
        'text-neutral-900 dark:text-neutral-100 bg-white/60 dark:bg-neutral-950/60'
      ]"
    ><code>{{ code }}</code></pre>
  </div>
</template>

<style scoped>
details[open] summary ~ * { animation: fadeIn 120ms ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: none; } }
</style>