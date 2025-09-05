<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { BASE_TERMS } from '~/glossary/base-terms'

const props = withDefaults(defineProps<{
  terms?: Record<string, string>
  enableAI?: boolean
  maxPerTerm?: number
  target?: string
}>(), {
  terms: () => ({}),
  enableAI: false,
  maxPerTerm: 3,
  target: '[data-content-root], article, main'
})

const rootEl = ref<HTMLElement | null>(null)
let observer: MutationObserver | null = null

function textFrom(el: Element): string {
  // Clone and prune noisy nodes (also remove anything inside cards)
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll(
    'code, pre, kbd, samp, a, h1, h2, h3, h4, h5, h6, button,' +
    '.card, [data-card], .card-content, .card-header, .card-footer,' +
    'uicard, uicardcontent, uicardheader, uicardfooter'
  ).forEach(n => n.remove())
  return clone.textContent || ''
}

function buildTermsMap(sourceText?: string): Promise<Record<string, string>> {
  // helper: normalize to a lowercase-keyed Map
  const toMap = (obj?: Record<string, string>) => {
    const map = new Map<string, string>()
    if (!obj) return map
    for (const [k, v] of Object.entries(obj)) {
      const key = (k ?? '').trim().toLowerCase()
      const val = (v ?? '').trim()
      if (key && val) map.set(key, val)
    }
    return map
  }

  // start with base + user-supplied terms (case-insensitive)
  const baseMerged = { ...BASE_TERMS, ...props.terms }
  const baseMap = toMap(baseMerged)

  // if AI disabled or no text, just return normalized object
  if (!props.enableAI || !sourceText?.trim()) {
    return Promise.resolve(Object.fromEntries(baseMap))
  }

  // otherwise, fetch AI terms and merge with precedence (AI wins)
  return $fetch<{ terms: Record<string, string> }>('/api/glossary/extract', {
    method: 'POST',
    body: {
      text: sourceText,
      // send known keys (lowercased & unique) to reduce duplicates
      known: Array.from(new Set(Object.keys(baseMerged).map(k => k.toLowerCase())))
    }
  })
  .then((r) => {
    const aiMap = toMap(r?.terms || {})
    // merge: base first, then AI overrides
    const out = new Map(baseMap)
    for (const [k, v] of aiMap) out.set(k, v)
    return Object.fromEntries(out)
  })
  .catch(() => Object.fromEntries(baseMap)) // graceful fallback
}

function applyGlossary(el: Element, terms: Record<string, string>) {
  const SKIP = new Set([
    'CODE','PRE','KBD','SAMP','A','H1','H2','H3','H4','H5','H6',
    'BUTTON','INPUT','TEXTAREA','SELECT'
  ])

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement
      if (!p) return NodeFilter.FILTER_REJECT
      if (SKIP.has(p.tagName)) return NodeFilter.FILTER_REJECT
      if (p.closest('.card, [data-card], .card-content, .card-header, .card-footer')) return NodeFilter.FILTER_REJECT
      if (p.closest('uicard, uicardcontent, uicardheader, uicardfooter')) return NodeFilter.FILTER_REJECT
      if (p.closest('code, pre, kbd, samp, a, button, input, textarea, select')) return NodeFilter.FILTER_REJECT
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    }
  })

  // Sort longer terms first (multi-word wins)
  const entries = Object.entries(terms)
    .filter(([k,v]) => k && v)
    .sort((a,b) => b[0].length - a[0].length)
  if (!entries.length) return

  const maxPer = props.maxPerTerm
  const perTermCount = new Map<string, number>()
  const patterns = entries.map(([term]) => {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return { term, re: new RegExp(`(?<![\\w/])(${esc})(?![\\w/])`, 'gi') }
  })

  const makeNode = (original: string, term: string, def: string) => {
  // CSS-only tooltip, theme-aware, larger text, with yellow question mark icon
  const span = document.createElement('span')
  span.className = 'group relative inline-flex items-center gap-1 cursor-help underline decoration-dotted underline-offset-4'
  span.setAttribute('aria-label', `Definition: ${def}`)
  span.innerHTML = `
  <span>${original}</span>
  <span
    class="pointer-events-none absolute left-1/2 top-full z-50 hidden -translate-x-1/2 whitespace-pre-line
           rounded-2xl border border-border bg-card/95 dark:bg-popover/95 backdrop-blur-md
           px-3 py-2 shadow-lg text-popover-foreground group-hover:block mt-2 w-max max-w-[22rem]">
    <span class="block text-base leading-6 md:text-lg md:leading-7">${def}</span>
  </span>
`
  return span
}

  const replacements: Array<{ node: Text, fragments: (Node | string)[] }> = []

  while (walker.nextNode()) {
    const textNode = walker.currentNode as Text
    const text = textNode.nodeValue || ''
    let idx = 0
    let changed = false
    const fragments: (Node | string)[] = []

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
      if (!matched) { fragments.push(text[idx]); idx += 1 }
    }

    if (changed) replacements.push({ node: textNode, fragments })
  }

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

  // Re-apply on SPA content swaps
  observer = new MutationObserver((muts) => {
    if (muts.some(m => m.addedNodes.length || m.removedNodes.length)) {
      observer?.disconnect()
      const fresh = textFrom(rootEl!.value!)
      buildTermsMap(fresh).then(terms => applyGlossary(rootEl!.value!, terms))
    }
  })
  observer.observe(container, { childList: true, subtree: true })
}

onMounted(() => requestAnimationFrame(run))
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <slot />
</template>

<style scoped>
/* subtle fade-in for the tooltip bubble */
.group:hover > span:last-child {
  animation: fadeIn .12s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translate(-50%, -2px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}
</style>





