<script setup lang="ts">
import { h, onMounted, onBeforeUnmount, ref, createApp, defineComponent, resolveComponent } from 'vue'
import { BASE_TERMS } from '~/glossary/base-terms'

const TooltipTerm = defineComponent<{
  text: string
  def: string
  tooltipTextClass?: string
}>({
  name: 'TooltipTerm',
  props: ['text', 'def', 'tooltipTextClass'] as any,
  setup(p) {
    const TP = resolveComponent('UiTooltipProvider')
    const TT = resolveComponent('UiTooltip')
    const TR = resolveComponent('UiTooltipTrigger')
    const TC = resolveComponent('UiTooltipContent')

    const haveShadcn =
      TP !== 'UiTooltipProvider' &&
      TT !== 'UiTooltip' &&
      TR !== 'UiTooltipTrigger' &&
      TC !== 'UiTooltipContent'

    // Fallback: native title so text never disappears
    if (!haveShadcn) {
      return () =>
        h('span', {
          class:
            'inline-block cursor-help underline decoration-dotted underline-offset-4',
          title: p.def
        }, p.text)
    }

    // shadcn tooltip with forced inner text sizing + elegant, theme-aware surface
    return () =>
      h(TP as any, { delayDuration: 80 }, () =>
        h(TT as any, null, {
          default: () => [
            h(TR as any, { asChild: true }, () =>
              h('span', {
                class:
                  'inline-block cursor-help underline decoration-dotted underline-offset-4'
              }, p.text)
            ),
            h(
              TC as any,
              {
                side: 'top',
                align: 'center',
                sideOffset: 6,
                // Force a non-black, theme-aware look:
                // - uses bg-popover (light) and dark:bg-neutral-900/90 with subtle border
                // - small blur for elegance, rounded corners, soft shadow
                class:
                  'max-w-sm whitespace-pre-line rounded-lg border ' +
                  'bg-popover/95 text-popover-foreground ' +
                  'dark:bg-neutral-900/90 dark:text-neutral-100 ' +
                  'backdrop-blur-sm shadow-md px-0 py-0'
              },
              () =>
                // Inner wrapper gets the font sizing so it always applies
                h('div', {
                  class:
                    `px-3 py-2 leading-snug ${p.tooltipTextClass || 'text-base'}`
                }, p.def)
            )
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



