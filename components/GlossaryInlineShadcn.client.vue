<script setup lang="ts">
import { h, onMounted, onBeforeUnmount, ref, createApp, defineComponent } from 'vue'
import { BASE_TERMS } from '~/glossary/base-terms'

const props = withDefaults(defineProps<{
  terms?: Record<string, string>
  enableAI?: boolean
  maxPerTerm?: number
  target?: string
  tooltipTextClass?: string
}>(), {
  terms: () => ({}),
  enableAI: false,
  maxPerTerm: 3,
  target: '[data-content-root], article, main',
  tooltipTextClass: 'text-base leading-snug md:text-[1.05rem]'
})

const rootEl = ref<HTMLElement | null>(null)
let observer: MutationObserver | null = null

function textFrom(el: Element): string {
  const clone = el.cloneNode(true) as HTMLElement
  // ignore content inside cards + usual noisy nodes
  clone.querySelectorAll(
    'code, pre, kbd, samp, a, h1, h2, h3, h4, h5, h6, button,' +
    '.card, [data-card], .card-content, .card-header, .card-footer,' +
    'uicard, uicardcontent, uicardheader, uicardfooter'
  ).forEach(n => n.remove())
  return clone.textContent || ''
}

async function buildTermsMap(sourceText?: string): Promise<Record<string, string>> {
  const merged = { ...BASE_TERMS, ...props.terms }
  if (!props.enableAI || !sourceText?.trim()) return merged
  try {
    const r = await $fetch<{ terms: Record<string, string> }>('/api/glossary/extract', {
      method: 'POST',
      body: { text: sourceText, known: Object.keys(merged) }
    })
    return { ...merged, ...r.terms }
  } catch {
    return merged
  }
}

// Render shadcn tooltip using globally-registered tags
const TooltipTerm = defineComponent<{
  text: string
  def: string
  tooltipTextClass?: string
}>({
  name: 'TooltipTerm',
  props: ['text', 'def', 'tooltipTextClass'] as any,
  setup(p) {
    return () =>
      h('UiTooltipProvider', { delayDuration: 80 }, () =>
        h('UiTooltip', null, {
          default: () => [
            h('UiTooltipTrigger', { asChild: true }, () =>
              h('span', {
                class: 'inline-block cursor-help underline decoration-dotted underline-offset-4'
              }, p.text)
            ),
            h('UiTooltipContent', {
              side: 'top',
              align: 'center',
              class: `max-w-xs whitespace-pre-line ${p.tooltipTextClass ?? 'text-base'}`
            }, () => p.def)
          ]
        })
      )
  }
})

function applyGlossary(el: Element, terms: Record<string, string>) {
  const SKIP_TAGS = new Set(['CODE','PRE','KBD','SAMP','A','H1','H2','H3','H4','H5','H6','BUTTON','INPUT','TEXTAREA','SELECT'])
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const p = node.parentElement
      if (!p) return NodeFilter.FILTER_REJECT
      if (SKIP_TAGS.has(p.tagName)) return NodeFilter.FILTER_REJECT
      if (p.closest('.card, [data-card], .card-content, .card-header, .card-footer')) return NodeFilter.FILTER_REJECT
      if (p.closest('uicard, uicardcontent, uicardheader, uicardfooter')) return NodeFilter.FILTER_REJECT
      if (p.closest('code, pre, kbd, samp, a, button, input, textarea, select')) return NodeFilter.FILTER_REJECT
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    }
  })

  const entries = Object.entries(terms).filter(([k,v]) => k && v).sort((a,b) => b[0].length - a[0].length)
  if (!entries.length) return

  const maxPer = props.maxPerTerm
  const perTerm = new Map<string, number>()
  const patterns = entries.map(([term]) => {
    const esc = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    return { term, re: new RegExp(`(?<![\\w/])(${esc})(?![\\w/])`, 'gi') }
  })

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
          const cap = perTerm.get(term) ?? 0
          if (cap < maxPer) {
            const before = text.slice(idx, m.index)
            if (before) fragments.push(before)

            const original = m[0]
            const def = terms[term]

            // mount a Vue app instance for the tooltip
            const mountEl = document.createElement('span')
            mountEl.className = 'inline-block align-baseline'
            fragments.push(mountEl)

            const app = createApp(TooltipTerm, { text: original, def, tooltipTextClass: props.tooltipTextClass })
            app.mount(mountEl)

            perTerm.set(term, cap + 1)
            idx = m.index + original.length
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


