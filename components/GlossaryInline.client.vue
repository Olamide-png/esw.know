<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { BASE_TERMS } from '~/glossary/base-terms'

// --- props ---
const props = withDefaults(defineProps<{
  /** Provide extra/override terms at runtime if you want */
  terms?: Record<string, string>
  /** If true, ask the server to AI-augment the term list from page text */
  enableAI?: boolean
  /** Max times to highlight the same term per page */
  maxPerTerm?: number
  /** CSS selector of the container to scan (defaults to main article) */
  target?: string
}>(), {
  terms: () => ({}),
  enableAI: false,
  maxPerTerm: 3,
  target: '[data-content-root], article, main'
})

const route = useRoute()
const rootEl = ref<HTMLElement | null>(null)
let observer: MutationObserver | null = null

function buildTermsMap(sourceText?: string): Promise<Record<string, string>> {
  const merged = { ...BASE_TERMS, ...props.terms }

  if (!props.enableAI || !sourceText?.trim()) return Promise.resolve(merged)

  // Ask the server to propose a few extra domain terms.
  return $fetch<{ terms: Record<string, string> }>('/api/glossary/extract', {
    method: 'POST',
    body: { text: sourceText, known: Object.keys(merged) }
  })
  .then(r => ({ ...merged, ...r.terms }))
  .catch(() => merged) // graceful fallback
}

function textFrom(el: Element): string {
  // Clone & prune code/pre/a/figcaption headers — we don't want those to bias AI.
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll('code, pre, kbd, samp, a, h1, h2, h3, h4, h5, h6').forEach(n => n.remove())
  return clone.textContent || ''
}

function applyGlossary(el: Element, terms: Record<string, string>) {
  // Skip noisy blocks
  const SKIP = new Set(['CODE','PRE','KBD','SAMP','A','H1','H2','H3','H4','H5','H6','BUTTON','INPUT','TEXTAREA','SELECT'])
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement
      if (!p) return NodeFilter.FILTER_REJECT
      if (SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT
      if (p.closest('code, pre, kbd, samp, a, button, input, textarea, select')) return NodeFilter.FILTER_REJECT
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    }
  })

  // Precompute regex for multi-word + single terms. Sort by length desc to prefer longer matches.
  const entries = Object.entries(terms)
    .filter(([k,v]) => k && v)
    .sort((a,b) => b[0].length - a[0].length)

  if (!entries.length) return

  const perTermCount = new Map<string, number>()
  const maxPer = props.maxPerTerm

  const patterns = entries.map(([term]) => {
    // Word boundaries with punctuation tolerance
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return { term, re: new RegExp(`(?<![\\w/])(${esc})(?![\\w/])`, 'gi') }
  })

  const makeNode = (original: string, term: string, def: string) => {
    const span = document.createElement('span')
    span.className = 'group relative inline-block cursor-help underline decoration-dotted underline-offset-4'
    span.setAttribute('aria-label', `Definition: ${def}`)
    span.innerHTML = `
  <span>${original}</span>
  <span
    class="pointer-events-none absolute left-1/2 top-full z-50 hidden -translate-x-1/2 whitespace-pre-line
           rounded-2xl border border-border bg-card/95 dark:bg-popover/95 backdrop-blur-xl
           px-3 py-2 shadow-lg text-popover-foreground group-hover:block mt-2 w-max max-w-[22rem]">
    <span class="block text-base leading-6 md:text-lg md:leading-7">${def}</span>
  </span>
`
    return span
  }

  const replacements: Array<{ node: Text, fragments: (Node | string)[] }> = []

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    let text = textNode.nodeValue || ''
    let changed = false
    const fragments: (Node | string)[] = []
    let idx = 0

    while (idx < text.length) {
      let matched = false

      for (const { term, re } of patterns) {
        re.lastIndex = idx
        const m = re.exec(text)
        if (m && m.index === idx) {
          const cap = perTermCount.get(term) || 0
          if (cap < maxPer) {
            const before = text.slice(idx, m.index)
            if (before) fragments.push(before)

            const original = m[0]
            const def = terms[term]
            fragments.push(makeNode(original, term, def))
            idx = m.index + original.length
            perTermCount.set(term, cap + 1)
            matched = true
            changed = true
            break
          }
        }
      }

      if (!matched) {
        // advance by one character when no term matched at this index
        fragments.push(text[idx])
        idx += 1
      }
    }

    if (changed) {
      replacements.push({ node: textNode, fragments })
    }
  }

  // Apply outside the walk to avoid live mutations during traversal
  for (const { node, fragments } of replacements) {
    const frag = document.createDocumentFragment()
    fragments.forEach(part => {
      if (typeof part === 'string') frag.appendChild(document.createTextNode(part))
      else frag.appendChild(part)
    })
    node.parentNode?.replaceChild(frag, node)
  }
}

function run() {
  const container = document.querySelector(props.target) as HTMLElement | null
  if (!container) return
  rootEl.value = container

  const pageText = textFrom(container)
  buildTermsMap(pageText).then(terms => applyGlossary(container, terms))

  // Re-apply if content rerenders
  observer = new MutationObserver((muts) => {
    const substantial = muts.some(m => m.addedNodes.length || m.removedNodes.length)
    if (substantial && rootEl.value) {
      // Avoid compounding: clear old wrappers by reloading the page section is hard;
      // simplest: disconnect, re-run once (idempotent for most docs unless SPA nav)
      observer?.disconnect()
      const fresh = textFrom(rootEl.value)
      buildTermsMap(fresh).then(terms => applyGlossary(rootEl!.value!, terms))
    }
  })
  observer.observe(container, { childList: true, subtree: true })
}

onMounted(() => {
  // small delay so the doc body is mounted
  requestAnimationFrame(run)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <!-- Wrap your page (or let layout include it) -->
  <slot />
</template>

<style scoped>
/* Optional: small fade/slide for tooltip */
.group:hover > span:last-child {
  animation: fadeIn .12s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -2px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}
</style>





