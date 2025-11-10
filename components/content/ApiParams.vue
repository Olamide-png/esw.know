<template>
  <!-- Top-level container (when NO node prop is passed) -->
  <section v-if="!node" class="relative w-full">
    <div class="rounded-2xl border border-black/10 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur">
      <header v-if="title" class="px-4 py-3 sm:px-6 border-b border-black/10 dark:border-white/10">
        <h3 class="text-base sm:text-lg font-semibold tracking-tight text-foreground">{{ title }}</h3>
        <p v-if="subtitle" class="mt-1 text-xs text-foreground/60">{{ subtitle }}</p>
      </header>

      <div class="divide-y divide-black/10 dark:divide-white/10">
        <div v-for="(n, i) in nodes" :key="i" class="px-4 sm:px-6 py-3">
          <!-- recurse into this same component for each node -->
          <ApiParams :node="n" :level="0" />
        </div>
      </div>
    </div>
  </section>

  <!-- Row renderer (when node prop IS passed) -->
  <div v-else>
    <!-- Row header -->
    <div class="flex items-start gap-3">
      <!-- Toggle if children exist -->
      <button
        v-if="hasChildren"
        type="button"
        :aria-label="expanded ? 'Collapse' : 'Expand'"
        class="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-md ring-1 ring-black/10 dark:ring-white/10 hover:bg-black/5 dark:hover:bg-white/10 transition"
        @click="expanded = !expanded"
      >
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
          <path :d="expanded ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6'" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div v-else class="mt-1 h-6 w-6 shrink-0"></div>

      <!-- Name + badges -->
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <code class="text-sm font-semibold text-foreground">{{ node.name }}</code>

          <span class="inline-flex items-center rounded-md border border-black/10 dark:border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-foreground/70">
            {{ typeLabel }}
          </span>

          <span v-if="node.required" class="inline-flex items-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 text-[11px] font-medium">
            required
          </span>

          <span v-if="formatLabel" class="inline-flex items-center rounded-md bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[11px] text-foreground/70">
            {{ formatLabel }}
          </span>

          <span v-if="rangeLabel" class="inline-flex items-center rounded-md bg-black/5 dark:bg-white/10 px-2 py-0.5 text-[11px] text-foreground/70">
            {{ rangeLabel }}
          </span>
        </div>

        <p v-if="node.description" class="mt-1 text-sm text-foreground/80">
          {{ node.description }}
        </p>

        <!-- Enum -->
        <div v-if="Array.isArray(node.enum) && node.enum.length" class="mt-2 flex flex-wrap items-center gap-2">
          <span class="text-[11px] uppercase text-foreground/60">Enum</span>
          <span
            v-for="(e, i) in node.enum"
            :key="i"
            class="inline-flex items-center rounded-full border border-black/10 dark:border-white/10 px-2 py-0.5 text-[11px] text-foreground/80"
          >
            {{ e }}
          </span>
        </div>
      </div>
    </div>

    <!-- Children -->
    <div v-if="hasChildren && expanded" class="mt-3 pl-6 sm:pl-9 border-l border-black/10 dark:border-white/10">
      <div class="divide-y divide-black/10 dark:divide-white/10">
        <div v-for="(c, idx) in children" :key="idx" class="py-3">
          <ApiParams :node="c" :level="(level || 0) + 1" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

// Give the component a name so it can recurse by referencing <ApiParams/>
defineOptions({ name: 'ApiParams' })

const props = defineProps({
  // TOP-LEVEL props (when used as ::api-params{...}::)
  schema:   { type: String, default: '' },
  title:    { type: String, default: 'Parameters' },
  subtitle: { type: String, default: '' },

  // INTERNAL recursion props (set automatically by this component)
  node:     { type: Object, default: null },
  level:    { type: Number, default: 0 },
})

/* ---------- Top level: parse schema ---------- */
const nodes = computed(() => {
  if (props.node) return [] // not top-level
  try {
    const v = JSON.parse(props.schema || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
})

/* ---------- Row rendering helpers ---------- */
const node = props.node || {}

const hasChildren = computed(() => {
  if (!props.node) return false
  if (Array.isArray(node.children) && node.children.length) return true
  if (node.type === 'array' && (node.items || node.item)) return true
  if (node.type === 'object' && node.properties && Object.keys(node.properties).length) return true
  return false
})

const children = computed(() => {
  if (!props.node) return []
  if (Array.isArray(node.children)) return node.children
  if (node.type === 'array' && node.items) {
    const it = node.items
    if (Array.isArray(it.children)) return it.children
    if (it && it.properties && typeof it.properties === 'object') {
      return Object.entries(it.properties).map(([name, spec]) => ({ name, ...spec }))
    }
  }
  if (node.type === 'object' && node.properties) {
    return Object.entries(node.properties).map(([name, spec]) => ({ name, ...spec }))
  }
  return []
})

const expanded = ref(Boolean(node.expanded || (props.level === 0 && hasChildren.value)))

const typeLabel = computed(() => {
  if (!props.node) return ''
  const t = String(node.type || 'string')
  if (t === 'array') {
    const itemType = node.items?.type || node.item?.type
    return itemType ? `array<${itemType}>` : 'array'
  }
  return t
})

const formatLabel = computed(() => (props.node ? (node.format ? node.format : (node.pattern ? 'pattern' : '')) : ''))

const rangeLabel = computed(() => {
  if (!props.node) return ''
  const lenMin = node.minLength ?? node.minItems
  const lenMax = node.maxLength ?? node.maxItems
  const numMin = node.minimum ?? node.exclusiveMinimum
  const numMax = node.maximum ?? node.exclusiveMaximum
  if (lenMin != null || lenMax != null) return `length ${lenMin ?? ''}${(lenMin!=null||lenMax!=null)?' .. ':''}${lenMax ?? ''}`
  if (numMin != null || numMax != null) return `range ${numMin ?? ''}${(numMin!=null||numMax!=null)?' .. ':''}${numMax ?? ''}`
  return ''
})
</script>



