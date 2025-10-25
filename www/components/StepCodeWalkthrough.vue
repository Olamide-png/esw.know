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
        <li
          v-for="(s, i) in steps"
          :key="s.id ?? i"
          class="group mb-3"
        >
          <button
            type="button"
            @click="setActive(i)"
            @mouseenter="preview(i)"
            class="w-full text-left"
            :aria-current="activeIndex === i ? 'step' : undefined"
          >
            <div
              class="flex items-start gap-3 rounded-2xl border p-4 transition
                     bg-white/60 dark:bg-neutral-900/60
                     hover:shadow-sm
                     border-neutral-200 dark:border-neutral-800
                    "
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

    <!-- Code -->
    <section class="relative">
      <header class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-medium opacity-75">{{ languageLabel }}</h3>
        <div class="flex items-center gap-2">
          <span class="text-xs opacity-60">Highlighted: Step {{ (activeIndex+1) }}</span>
          <button
            @click="copyCleanCode"
            class="rounded-lg border px-2.5 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900
                   border-neutral-200 dark:border-neutral-800"
            :aria-label="'Copy ' + languageLabel + ' code'"
          >
            Copy
          </button>
        </div>
      </header>

      <div
        ref="codeBox"
        class="relative overflow-auto rounded-2xl border
               border-neutral-200 dark:border-neutral-800
               bg-neutral-50/70 dark:bg-neutral-950/70
               max-h-[560px] shadow-inner"
      >
        <pre :class="['m-0 p-4 text-sm leading-6', language ? `language-${language}` : '']">
          <code>
            <template v-for="(line, i) in displayLines" :key="i">
              <div
                :ref="el => (lineEls[i] = el)"
                class="group flex gap-4 pr-4 -mr-4 rounded-md"
                :class="isHighlighted(i+1) ? 'bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/30' : ''"
              >
                <span
                  class="select-none w-10 shrink-0 text-right pr-2 opacity-50 tabular-nums font-mono"
                >{{ i + 1 }}</span>
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

type Step = {
  id?: string | number
  title: string
  body?: string
  // Optional explicit line ranges for this step (1-based). Examples:
  // [5] (single line), [ [3,8], [12,15] ] (multiple ranges)
  lines?: Array<number | [number, number]>
}

const props = withDefaults(defineProps<{
  steps: Step[]
  code: string
  language?: string
  initialStep?: number
  // When true, parse inline markers like [1], [2:start] ... [2:end]
  parseMarkers?: boolean
  scrollToActive?: boolean
}>(), {
  language: 'js',
  initialStep: 0,
  parseMarkers: true,
  scrollToActive: true
})

const activeIndex = ref(Math.min(Math.max(props.initialStep, 0), props.steps.length - 1))
const previewIndex = ref<number | null>(null)
const codeBox = ref<HTMLElement | null>(null)
const lineEls = ref<(HTMLElement | null)[]>([])

const rawLines = computed(() => props.code.replace(/\r\n/g, '\n').split('\n'))

/**
 * Marker parsing:
 * - Single-line:      // [1] or # [1] or <!-- [1] -->
 * - Range start/end:  // [2:start] ... // [2:end]
 * We strip markers from the display but keep mapping.
 */
type MapLines = Record<string, Set<number>>
const parsedMap = ref<MapLines>({})
const displayLines = ref<string[]>([])

const languageLabel = computed(() => {
  const map: Record<string, string> = {
    js: 'JavaScript',
    ts: 'TypeScript',
    py: 'Python',
    rb: 'Ruby',
    go: 'Go',
    php: 'PHP',
    java: 'Java',
    sh: 'Shell',
    html: 'HTML'
  }
  return map[props.language || ''] || (props.language?.toUpperCase() ?? 'Code')
})

function buildFromMarkers() {
  const map: MapLines = {}
  const out: string[] = []
  const rangeStack: Record<string, boolean> = {} // stepId -> inRange

  const singleRe = /\[\s*([\w.-]+)\s*\]/g
  const startRe  = /\[\s*([\w.-]+)\s*:(?:start|begin)\s*\]/i
  const endRe    = /\[\s*([\w.-]+)\s*:(?:end|stop)\s*\]/i

  rawLines.value.forEach((orig, idx) => {
    let line = orig
    const ln = idx + 1

    // Detect range starts/ends
    const sMatch = line.match(startRe)
    const eMatch = line.match(endRe)

    if (sMatch) {
      rangeStack[sMatch[1]] = true
      line = line.replace(startRe, '').replace(/\s+$/, '')
    }
    if (eMatch) {
      rangeStack[eMatch[1]] = false
      line = line.replace(endRe, '').replace(/\s+$/, '')
    }

    // Apply active ranges
    Object.entries(rangeStack).forEach(([stepId, on]) => {
      if (on) {
        map[stepId] ??= new Set()
        map[stepId].add(ln)
      }
    })

    // Single-line marks (can have multiple)
    let m
    singleRe.lastIndex = 0
    while ((m = singleRe.exec(line)) !== null) {
      const stepId = m[1]
      map[stepId] ??= new Set()
      map[stepId].add(ln)
    }
    // Strip all marker tokens from visible line
    line = line.replace(singleRe, '').trimEnd()

    out.push(line)
  })

  parsedMap.value = map
  displayLines.value = out
}

function buildWithoutMarkers() {
  // No marker parsing; just show code, step->lines must be provided on each step.
  parsedMap.value = {}
  displayLines.value = rawLines.value.slice()
}

onMounted(() => {
  props.parseMarkers ? buildFromMarkers() : buildWithoutMarkers()
  // initial scroll
  scrollToFirstHighlighted()
})

// Step → line set resolver
const highlightSet = computed<Set<number>>(() => {
  const idx = previewIndex.value ?? activeIndex.value
  const step = props.steps[idx]
  const set = new Set<number>()

  // Prefer explicit lines prop
  if (step?.lines && step.lines.length) {
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

  // Fallback: parseMarkers mapping via step.id or index+1 string
  if (props.parseMarkers) {
    const keyCandidates: string[] = []
    if (step?.id != null) keyCandidates.push(String(step.id))
    keyCandidates.push(String(idx + 1)) // default numeric IDs 1..N
    for (const k of keyCandidates) {
      const bucket = parsedMap.value[k]
      if (bucket && bucket.size) {
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
  activeIndex.value = i
  previewIndex.value = null
  scrollToFirstHighlighted()
}

function preview(i: number) {
  previewIndex.value = i
}

function goNext() {
  setActive(Math.min(activeIndex.value + 1, props.steps.length - 1))
}
function goPrev() {
  setActive(Math.max(activeIndex.value - 1, 0))
}

watch(() => previewIndex.value, (v) => {
  if (v != null && v !== activeIndex.value) {
    // hover preview scroll
    scrollToFirstHighlighted(true)
  }
})

function scrollToFirstHighlighted(isPreview = false) {
  if (!props.scrollToActive) return
  // find the first highlighted line element and center it
  const total = displayLines.value.length
  for (let i = 0; i < total; i++) {
    if (isHighlighted(i + 1)) {
      const el = lineEls.value[i]
      const box = codeBox.value
      if (el && box) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
      break
    }
  }
}

async function copyCleanCode() {
  const text = displayLines.value.join('\n')
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}
</script>