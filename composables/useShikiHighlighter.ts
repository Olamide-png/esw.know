// composables/useShikiHighlighter.ts
import { ref, shallowRef, onBeforeUnmount } from 'vue'

type Highlighter = {
  codeToHtml: (code: string, opts: { lang: string; theme: string }) => string
}

const ready = ref(false)
const theme = ref<'github-dark-default' | 'github-light-default'>('github-dark-default')
const highlighter = shallowRef<Highlighter | null>(null)

let ensurePromise: Promise<void> | null = null
let mql: MediaQueryList | null = null

function pickTheme() {
  if (import.meta.client && window.matchMedia?.('(prefers-color-scheme: light)').matches) {
    theme.value = 'github-light-default'
  } else {
    theme.value = 'github-dark-default'
  }
}

async function ensure() {
  if (!import.meta.client) return
  if (ensurePromise) return ensurePromise
  ensurePromise = (async () => {
    const { getHighlighter } = await import('shiki')
    const githubDark = (await import('shiki/themes/github-dark-default.mjs')).default
    const githubLight = (await import('shiki/themes/github-light-default.mjs')).default
    const bash = (await import('shiki/langs/bash.mjs')).default
    const json = (await import('shiki/langs/json.mjs')).default
    highlighter.value = await getHighlighter({
      themes: [githubDark, githubLight],
      langs: [bash, json],
    })
    pickTheme()
    // react to system theme changes
    if (window.matchMedia) {
      mql = window.matchMedia('(prefers-color-scheme: light)')
      mql.addEventListener?.('change', () => pickTheme())
    }
    ready.value = true
  })()
  return ensurePromise
}

async function highlight(code: string, lang: 'bash' | 'json' | string) {
  await ensure()
  if (!highlighter.value) return ''
  return highlighter.value.codeToHtml(code ?? '', { lang, theme: theme.value })
}

export function useShikiHighlighter() {
  // consumers may call ensure() when they actually need highlighting
  onBeforeUnmount(() => {
    // nothing to dispose from shiki, just detach listener
    if (mql) mql = null
  })
  return { ready, theme, ensure, highlight }
}
