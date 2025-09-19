<!-- /components/ApiSnippet.vue – Shiki v3 patch -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { codeToHtml } from 'shiki'   // ⬅️ v3 API

type SnippetMap = Record<string, string>

const props = withDefaults(defineProps<{
  title?: string
  kind?: 'request' | 'response'
  snippets?: SnippetMap
  languageOrder?: string[]
  initialLanguage?: string
  monospace?: boolean
  wrap?: boolean
  copySettings?: { label?: string; tooltip?: string }
  expandSettings?: { label?: string; tooltip?: string }
  collapseSettings?: { label?: string; tooltip?: string }
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

const open = ref(false)
const currentLang = ref(props.initialLanguage)
const code = computed(() => props.snippets[currentLang.value] ?? '')
const isResponse = computed(() => props.kind === 'response')

// icons unchanged
const langIcon = (lang: string) => ({
  curl: '🌐', bash: '🌐', sh: '🌐',
  javascript: '🟨', typescript: '🟦',
  python: '🐍', php: '🐘', java: '☕',
  ruby: '💎', go: '🌀', json: '🧩'
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

/* -------------------------
   Shiki v3 wiring (no getHighlighter)
--------------------------*/
const highlightedHtml = ref<string>('')

// map dropdown key -> shiki language id
const shikiLangFor = (k: string) => ({ curl: 'bash', sh: 'bash' } as Record<string, string>)[k] || k
const themes = { light: 'github-light', dark: 'github-dark' }
const currentTheme = () =>
  document.documentElement.classList.contains('dark') ? themes.dark : themes.light

async function renderHighlight() {
  // codeToHtml auto-loads the requested theme/lang in v3
  highlightedHtml.value = await codeToHtml(code.value || '', {
    lang: shikiLangFor(currentLang.value),
    theme: currentTheme()
  })
}

function watchColorScheme() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => renderHighlight()
  mq.addEventListener?.('change', handler)
  // also react to toggling .dark class
  const obs = new MutationObserver(() => renderHighlight())
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
}

onMounted(async () => {
  await renderHighlight()
  watch([currentLang, code], () => renderHighlight(), { immediate: false })
  watchColorScheme()

  if (container.value && !open.value) {
    const max = 320
    if (container.value.scrollHeight > max) container.value.style.maxHeight = max + 'px'
  }
})
</script>

<template>
  <div class="group relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/60 shadow-sm overflow-hidden">
    <!-- header & controls unchanged ... -->

    <!-- Code: Shiki HTML -->
    <div
      ref="container"
      class="relative m-0 max-h-[320px] overflow-auto p-0 text-xs leading-relaxed"
      :class="[
        'bg-white/60 dark:bg-neutral-950/60',
        wrap ? 'whitespace-pre-wrap break-words' : 'whitespace-pre'
      ]"
    >
      <div v-if="highlightedHtml" v-html="highlightedHtml" class="!m-0"></div>
      <pre v-else class="p-4 text-neutral-900 dark:text-neutral-100"><code>{{ code }}</code></pre>
    </div>
  </div>
</template>

<style scoped>
:deep(.shiki) {
  margin: 0;
  padding: 16px;
  overflow: auto;
  border-radius: 0;
  background: transparent;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "JetBrains Mono", monospace;
  line-height: 1.6;
  font-size: 12px;
}
:deep(.shiki .line) { min-height: 1.25rem; }
details[open] summary ~ * { animation: fadeIn 120ms ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-2px); } to { opacity: 1; transform: none; } }
</style>

