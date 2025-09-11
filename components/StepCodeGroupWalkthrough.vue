<!-- StepCodeGroupWalkthrough.vue -->
<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Steps -->
    <section
      class="space-y-3"
      @keydown.arrow-down.prevent="goNext"
      @keydown.arrow-right.prevent="goNext"
      @keydown.arrow-up.prevent="goPrev"
      @keydown.arrow-left.prevent="goPrev"
      tabindex="0"
      aria-label="Walkthrough steps"
    >
      <header class="flex items-center justify-between">
        <h2 class="text-lg font-semibold">Walkthrough</h2>
        <div class="text-xs opacity-70">Step {{ activeIndex + 1 }} / {{ steps.length }}</div>
      </header>

      <ol class="relative">
        <li v-for="(s, i) in steps" :key="s.id ?? i" class="group mb-3">
          <button
            type="button"
            @click="setActive(i)"
            @mouseenter="preview(i)"
            @mouseleave="previewIndex = null"
            class="w-full text-left"
            :aria-current="activeIndex === i ? 'step' : undefined"
          >
            <div
              class="flex items-start gap-3 rounded-2xl border p-4 transition
                     bg-white/60 dark:bg-neutral-900/60 hover:shadow-sm
                     border-neutral-200 dark:border-neutral-800"
              :class="activeIndex === i
                ? 'ring-1 ring-primary/40 border-primary/50 bg-primary/5 dark:bg-primary/15'
                : ''"
            >
              <div
                class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold
                       bg-neutral-100 dark:bg-neutral-800
                       text-neutral-700 dark:text-neutral-200
                       group-hover:scale-105 transition"
                :class="activeIndex === i ? 'bg-primary text-white dark:text-white' : ''"
              >
                {{ i + 1 }}
              </div>
              <div class="space-y-1">
                <div class="font-medium">{{ s.title }}</div>
                <p v-if="s.body" class="text-sm text-neutral-600 dark:text-neutral-400">
                  {{ s.body }}
                </p>
              </div>
            </div>
          </button>
        </li>
      </ol>

      <div class="flex gap-2 pt-2">
        <button
          class="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900
                 border-neutral-200 dark:border-neutral-800"
          @click="goPrev"
        >
          ← Prev
        </button>
        <button
          class="rounded-xl border px-3 py-1.5 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900
                 border-neutral-200 dark:border-neutral-800"
          @click="goNext"
        >
          Next →
        </button>
      </div>
    </section>

    <!-- Code with “CodeGroup-like” tabs -->
    <section class="relative lg:sticky lg:top-4">
      <div class="mb-2 flex items-center justify-between gap-3">
        <div class="flex items-center gap-1 overflow-auto">
          <button
            v-for="(b, i) in blocks"
            :key="b.key || i"
            type="button"
            class="px-3 py-1.5 rounded-lg text-sm border
                   border-neutral-200 dark:border-neutral-800
                   hover:bg-neutral-50 dark:hover:bg-neutral-900 transition
                   mr-1"
            :class="i === activeBlockIndex
              ? 'bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/30'
              : ''"
            @click="setActiveBlock(i)"
          >
            <span class="font-medium">{{ b.label || languageLabel(b.language) }}</span>
          </button>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs opacity-60 hidden md:inline">
            Highlighted: Step {{ activeIndex + 1 }}
          </span>
          <button
            @click="copyCleanCode"
            class="rounded-lg border px-2.5 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900
                   border-neutral-200 dark:border-neutral-800"
          >
            Copy
          </button>
        </div>
      </div>

      <div
        ref="codeBox"
        class="relative overflow-auto rounded-2xl border
               border-neutral-200 dark:border-neutral-800
               bg-neutral-50/70 dark:bg-neutral-950/70
               max-h-[560px] shadow-inner"
      >
        <pre
          :key="'code-'+activeBlockIndex"
          :class="['m-0 p-4 text-sm leading-6', blocks[activeBlockIndex]?.language ? `language-${blocks[activeBlockIndex]?.language}` : '']"
        >
          <code>
            <template v-for="(line, i) in displayLines" :key="i">
              <div
                :ref="el => (lineEls[i] = el)"
                class="group relative flex gap-4 pr-4 -mr-4 rounded-md transition-colors"
                :class="isHighlighted(i+1)
                  ? 'bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/30 border-l-2 border-primary/60'
                  : 'border-l-2 border-transparent'"
              >
                <span class="select-none w-10 shrink-0 text-right pr-2 opacity-50 tabular-nums font-mono">{{ i + 1 }}</span>
                <span class="whitespace-pre-wrap font-mono">{{ line }}</span>
              </div>
            </template>
          </code>
        </pre>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

type Step = {
  id?: string | number
  title: string
  body?: string
  lines?: Array<number | [number, number]>
}

type CodeBlock = {
  key?: string
  label?: string   // e.g., "JavaScript", "TypeScript"
  language?: string // for prism class e.g. 'js', 'ts', 'py'
  code: string
}

const props = withDefaults(defineProps<{
  steps: Step[]
  blocks: CodeBlock[]                        // multiple language blocks
  initialStep?: number
  initialBlock?: number
  parseMarkers?: boolean
  scrollToActive?: boolean
  deeplink?: boolean                         // sync #step-N and ?lang=key
}>(), {
  initialStep: 0,
  initialBlock: 0,
  parseMarkers: true,
  scrollToActive: true,
  deeplink: true
})

const route = useRoute()
const router = useRouter()

const activeIndex = ref(0)
const previewIndex = ref<number | null>(null)
const activeBlockIndex = ref(0)

const codeBox = ref<HTMLElement | null>(null)
const lineEls = ref<(HTMLElement | null)[]>([])

type MapLines = Record<string, Set<number>>
const parsedMapPerBlock = ref<Map<string, MapLines>>(new Map())
const displayLines = ref<string[]>([])
const rawLines = ref<string[]>([])

// init based on deeplink (step + lang)
onMounted(() => {
  // block init
  let bIdx = props.initialBlock
  if (props.deeplink) {
    const fromQueryKey = typeof route.query.lang === 'string' ? route.query.lang : undefined
    if (fromQueryKey) {
      const idx = props.blocks.findIndex(b =>
        (b.key && b.key === fromQueryKey) || (b.language && b.language === fromQueryKey)
      )
      if (idx >= 0) bIdx = idx
    }
  }
  activeBlockIndex.value = clamp(bIdx, 0, props.blocks.length - 1)

  // step init
  let sIdx = props.initialStep
  if (props.deeplink) {
    const fromQuery = Number(route.query.step)
    const fromHash = (() => {
      const m = route.hash?.match(/^#step-(\d+)$/)
      return m ? Number(m[1]) : NaN
    })()
    const target = Number.isFinite(fromQuery) ? fromQuery
                 : Number.isFinite(fromHash) ? fromHash
                 : props.initialStep + 1
    sIdx = clamp((target as number) - 1, 0, props.steps.length - 1)
  }
  activeIndex.value = sIdx

  // build initial block
  rebuildForBlock(activeBlockIndex.value)
  scrollToFirstHighlighted()
})

watch(activeBlockIndex, (idx) => {
  rebuildForBlock(idx)
  if (props.deeplink) {
    const key = props.blocks[idx]?.key || props.blocks[idx]?.language || String(idx)
    router.replace({ query: { ...route.query, lang: key } })
  }
})

watch(() => previewIndex.value, (v) => {
  if (v != null && v !== activeIndex.value) scrollToFirstHighlighted(true)
})
watch(activeIndex, (i) => {
  if (!props.deeplink) return
  const hash = `#step-${i + 1}`
  if (route.hash !== hash) router.replace({ hash })
})

function rebuildForBlock(idx: number) {
  const block = props.blocks[idx]
  const text = (block?.code || '').replace(/\r\n/g, '\n')
  rawLines.value = text.split('\n')

  // reset element refs so scroll/highlight binds to the new DOM
  lineEls.value = []

  if (props.parseMarkers) {
    const map = buildFromMarkers(rawLines.value)
    parsedMapPerBlock.value.set(String(idx), map)
    const out = stripMarkers(rawLines.value)
    displayLines.value = out
  } else {
    parsedMapPerBlock.value.set(String(idx), {})
    displayLines.value = rawLines.value.slice()
  }
}

function buildFromMarkers(lines: string[]): MapLines {
  const map: MapLines = {}
  const rangeStack: Record<string, boolean> = {}
  const singleRe = /\[\s*([\w.-]+)\s*\]/g
  const startRe  = /\[\s*([\w.-]+)\s*:(?:start|begin)\s*\]/i
  const endRe    = /\[\s*([\w.-]+)\s*:(?:end|stop)\s*\]/i

  lines.forEach((orig, idx) => {
    let line = orig
    const ln = idx + 1

    const sMatch = line.match(startRe)
    const eMatch = line.match(endRe)
    if (sMatch) {
      rangeStack[sMatch[1]] = true
      line = line.replace(startRe, '').replace(/\s+$/, '')
      lines[idx] = line
    }
    if (eMatch) {
      rangeStack[eMatch[1]] = false
      line = line.replace(endRe, '').replace(/\s+$/, '')
      lines[idx] = line
    }

    Object.entries(rangeStack).forEach(([stepId, on]) => {
      if (on) {
        map[stepId] ??= new Set()
        map[stepId].add(ln)
      }
    })

    let m
    singleRe.lastIndex = 0
    while ((m = singleRe.exec(line)) !== null) {
      const stepId = m[1]
      map[stepId] ??= new Set()
      map[stepId].add(ln)
    }
  })
  return map
}

function stripMarkers(lines: string[]): string[] {
  const singleRe = /\[\s*([\w.-]+)\s*\]/g
  const startRe  = /\[\s*([\w.-]+)\s*:(?:start|begin)\s*\]/i
  const endRe    = /\[\s*([\w.-]+)\s*:(?:end|stop)\s*\]/i
  return lines.map(l => l.replace(singleRe, '').replace(startRe, '').replace(endRe, '').trimEnd())
}

const highlightSet = computed<Set<number>>(() => {
  const idx = previewIndex.value ?? activeIndex.value
  const step = props.steps[idx]
  const set = new Set<number>()

  if (step?.lines?.length) {
    for (const entry of step.lines) {
      if (typeof entry === 'number') set.add(entry)
      else {
        const [a, b] = entry
        const start = Math.max(1, Math.min(a, b))
        const end   = Math.max(a, b)
        for (let i = start; i <= end; i++) set.add(i)
      }
    }
    return set
  }

  // fall back to marker map by step.id or index+1
  const map = parsedMapPerBlock.value.get(String(activeBlockIndex.value)) || {}
  if (props.parseMarkers) {
    const candidates: string[] = []
    if (step?.id != null) candidates.push(String(step.id))
    candidates.push(String(idx + 1))
    for (const k of candidates) {
      const bucket = (map as any)[k] as Set<number> | undefined
      if (bucket?.size) {
        bucket.forEach(n => set.add(n))
        break
      }
    }
  }
  return set
})

function isHighlighted(lineNo: number) {
  return highlightSet.value.has(lineNo)
}

function setActive(i: number) {
  activeIndex.value = clamp(i, 0, props.steps.length - 1)
  previewIndex.value = null
  scrollToFirstHighlighted()
}

function preview(i: number) {
  previewIndex.value = i
}

function setActiveBlock(i: number) {
  activeBlockIndex.value = clamp(i, 0, props.blocks.length - 1)
  previewIndex.value = null // avoid stale highlight
  scrollToFirstHighlighted()
}

function goNext() { setActive(activeIndex.value + 1) }
function goPrev() { setActive(activeIndex.value - 1) }

function scrollToFirstHighlighted(isPreview = false) {
  const total = displayLines.value.length
  for (let i = 0; i < total; i++) {
    if (isHighlighted(i + 1)) {
      const el = lineEls.value[i]
      const box = codeBox.value
      if (el && box) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      break
    }
  }
}

async function copyCleanCode() {
  const text = displayLines.value.join('\n')
  try { await navigator.clipboard.writeText(text) } catch { /* ignore */ }
}

function languageLabel(lang?: string) {
  const map: Record<string, string> = {
    js: 'JavaScript', ts: 'TypeScript', py: 'Python', rb: 'Ruby',
    go: 'Go', php: 'PHP', java: 'Java', sh: 'Shell', html: 'HTML', json: 'JSON'
  }
  return map[lang || ''] || (lang?.toUpperCase() ?? 'Code')
}

function clamp(n: number, a: number, b: number) { return Math.min(Math.max(n, a), b) }
</script>

