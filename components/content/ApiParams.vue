<template>
  <section class="relative w-full">
    <div class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur">
      <header v-if="title" class="px-4 py-3 sm:px-6 border-b border-black/10 dark:border-white/10">
        <h3 class="text-base sm:text-lg font-semibold tracking-tight text-foreground">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-xs text-foreground/60">{{ subtitle }}</p>
      </header>

      <div class="divide-y divide-black/10 dark:divide-white/10">
        <div v-for="(n, i) in nodes" :key="i" class="px-4 sm:px-6 py-3">
          <ParamRow :node="n" :level="0" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, defineComponent, ref } from 'vue'

const props = defineProps({
  /** JSON array schema (see usage below) */
  schema:   { type: String, required: true },
  title:    { type: String, default: 'Parameters' },
  subtitle: { type: String, default: '' },
})

const nodes = computed(() => {
  try { const v = JSON.parse(props.schema); return Array.isArray(v) ? v : [] } catch { return [] }
})

/** Inline recursive subcomponent (template-only, no JSX) */
const ParamRow = defineComponent({
  name: 'ParamRow',
  props: { node: { type: Object, required: true }, level: { type: Number, default: 0 } },
  setup(p) {
    const expanded = ref(Boolean(p.node.expanded || (p.level === 0 && hasChildren(p.node))))
    function hasChildren(n) {
      if (Array.isArray(n.children) && n.children.length) return true
      if (n.type === 'array' && (n.items || n.item)) return true
      if (n.type === 'object' && n.properties && Object.keys(n.properties).length) return true
      return false
    }
    function childList(n) {
      if (Array.isArray(n.children)) return n.children
      if (n.type === 'array' && n.items) {
        const it = n.items
        if (Array.isArray(it.children)) return it.children
        if (it && it.properties) return Object.entries(it.properties).map(([name, spec]) => ({ name, ...spec }))
      }
      if (n.type === 'object' && n.properties) return Object.entries(n.properties).map(([name, spec]) => ({ name, ...spec }))
      return []
    }
    function typeLabel(n) {
      const t = (n.type || 'string') + ''
      if (t === 'array') {
        const it = n.items?.type || n.item?.type
        return it ? `array<${it}>` : 'array'
      }
      return t
    }
    function formatLabel(n) { return n.format ? n.format : (n.pattern ? 'pattern' : '') }
    function rangeLabel(n) {
      const lenMin = n.minLength ?? n.minItems
      const lenMax = n.maxLength ?? n.maxItems
      const numMin = n.minimum ?? n.exclusiveMinimum
      const numMax = n.maximum ?? n.exclusiveMaximum
      if (lenMin != null || lenMax != null) return `length ${lenMin ?? ''}${(lenMin!=null||lenMax!=null)?' .. ':''}${lenMax ?? ''}`
      if (numMin != null || numMax != null) return `range ${numMin ?? ''}${(numMin!=null||numMax!=null)?' .. ':''}${numMax ?? ''}`
      return ''
    }

    return () => (
      <div>
        <div class="flex items-start gap-3">
          { hasChildren(p.node) ? (
            <button type="button" aria-label={expanded.value ? 'Collapse' : 'Expand'}
              class="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition"
              onClick={() => expanded.value = !expanded.value}>
              <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
                <path d={expanded.value ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'} stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          ) : (
            <div class="mt-1 h-6 w-6 shrink-0"></div>
          )}

          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <code class="text-sm font-semibold text-foreground">{ p.node.name }</code>
              <span class="inline-flex items-center rounded-md border border-black/10 dark:border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-foreground/70">
                { typeLabel(p.node) }
              </span>
              { p.node.required ? (
                <span class="inline-flex items-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 text-[11px] font-medium">required</span>
              ) : null }
              { formatLabel(p.node) ? (
                <span class="inline-flex items-center rounded-md bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[11px] text-foreground/70">
                  { formatLabel(p.node) }
                </span>
              ) : null }
              { rangeLabel(p.node) ? (
                <span class="inline-flex items-center rounded-md bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[11px] text-foreground/70">
                  { rangeLabel(p.node) }
                </span>
              ) : null }
            </div>
            { p.node.description ? (<p class="mt-1 text-sm text-foreground/80">{ p.node.description }</p>) : null }
            { Array.isArray(p.node.enum) && p.node.enum.length ? (
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span class="text-[11px] uppercase text-foreground/60">Enum</span>
                { p.node.enum.map((e, i) => (
                  <span class="inline-flex items-center rounded-full border border-black/10 dark:border-white/10 px-2 py-0.5 text-[11px] text-foreground/80" key={i}>{ e }</span>
                )) }
              </div>
            ) : null }
          </div>
        </div>

        { hasChildren(p.node) && expanded.value ? (
          <div class="mt-3 pl-6 sm:pl-9 border-l border-black/10 dark:border-white/10">
            <div class="divide-y divide-black/10 dark:divide-white/10">
              { childList(p.node).map((c, i) => (
                <div class="py-3" key={i}><ParamRow node={c} level={(p.level || 0) + 1} /></div>
              )) }
            </div>
          </div>
        ) : null }
      </div>
    )
  },
})
</script>

