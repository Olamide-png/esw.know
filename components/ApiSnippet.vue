<!-- /components/ApiSnippet.vue – Shiki v3 + sticky header + not-prose + Iconify logos -->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { codeToHtml } from 'shiki'   // v3 API

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

/* Icon mapping (uses @iconify-json/logos). Falls back to vscode/simple-icons where needed. */
const iconNameFor = (k: string) =>
  ({
    curl: 'vscode-icons:file-type-bash',
    bash: 'vscode-icons:file-type-bash',
    sh: 'vscode-icons:file-type-bash',
    javascript: 'logos:javascript',
    typescript: 'logos:typescript-icon',
    python: 'logos:python',
    php: 'logos:php',
    java: 'logos:java',
    ruby: 'logos:ruby',
    go: 'logos:go',
    json: 'vscode-icons:file-type-json',
  } as Record<string, string>)[k] || 'vscode-icons:file-type-code'

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
   Shiki v3 wiring
--------------------------*/
const highlightedHtml = ref<string>('')

const shikiLangFor = (k: string) => ({ curl: 'bash', sh: 'bash' } as Record<string, string>)[k] || k
const themes = { light: 'github-light', dark: 'dracula' }
const currentTheme = () =>
  document.documentElement.classList.contains('dark') ? themes.dark : themes.light

async function renderHighlight() {
  highlightedHtml.value = await codeToHtml(code.value || '', {
    lang: shikiLangFor(currentLang.value),
    theme: currentTheme()
  })
}

function watchColorScheme() {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const handler = () => renderHighlight()
  mq.addEventListener?.('change', handler)
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
  <!-- not-prose prevents Tailwind Typography from clobbering buttons/details -->
  <div class="not-prose group relative rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/60 shadow-sm overflow-hidden">
    <!-- Sticky header -->
    <div
      class="sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2 border-b border-neutral-200/70 dark:border-neutral-800/70
             bg-neutral-50/80 dark:bg-neutral-900/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur-md"
    >
      <div class="min-w-0 flex items-center gap-2">
        <span
          v-if="badge"
          class="inline-flex items-center rounded-md bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground px-2 py-0.5 text-xs font-medium"
        >
          {{ badge }}
        </span>
        <h3 class="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {{ title || (isResponse ? 'Response' : 'Request') }}
        </h3>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <!-- Language dropdown -->
        <div v-if="Object.keys(snippets).length > 1" class="relative z-10 shrink-0">
          <details class="open:shadow-inner [&_summary::-webkit-details-marker]:hidden">
            <summary
              class="flex items-center gap-1 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900 cursor-pointer"
            >
              <Icon :name="iconNameFor(currentLang)" class="h-3.5 w-3.5 shrink-0" />
              <span class="select-none capitalize">{{ currentLang }}</span>
              <svg class="h-3 w-3 opacity-70" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"/>
              </svg>
            </summary>
            <ul
              class="absolute right-0 mt-1 w-48 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 py-1 z-20"
            >
              <li v-for="lang in languageOrder" :key="lang">
                <button
                  type="button"
                  @click="currentLang = lang"
                  class="flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
                >
                  <Icon :name="iconNameFor(lang)" class="h-3.5 w-3.5 shrink-0" />
                  <span class="capitalize">{{ lang }}</span>
                </button>
              </li>
            </ul>
          </details>
        </div>

        <!-- Copy -->
        <button
          :title="copySettings.tooltip || 'Copy'"
          class="shrink-0 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
          @click="copyCode"
        >
          {{ showCopied ? 'Copied' : (copySettings.label || 'Copy') }}
        </button>

        <!-- Expand / Collapse -->
        <button
          v-if="!open"
          :title="expandSettings.tooltip || 'Expand'"
          class="shrink-0 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
          @click="open = true; container && (container.style.maxHeight = 'none')"
        >
          {{ expandSettings.label || 'Expand' }}
        </button>
        <button
          v-else
          :title="collapseSettings.tooltip || 'Collapse'"
          class="shrink-0 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-2 py-1 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-900"
          @click="open = false; container && (container.style.maxHeight = '320px')"
        >
          {{ collapseSettings.label || 'Collapse' }}
        </button>
      </div>
    </div>

    <!-- Scrollable code area -->
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



