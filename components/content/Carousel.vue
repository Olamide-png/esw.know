<template>
  <section class="relative w-full">
    <div
      class="overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/60 dark:bg-white/5 backdrop-blur"
      @pointerdown="onDown" @pointermove="onMove" @pointerup="onUp" @pointercancel="onUp" @pointerleave="onUp"
    >
      <div class="flex transition-transform duration-500 ease-out" :style="{ transform: `translateX(-${idx * 100}%)` }">
        <figure v-for="(it, i) in slides" :key="i" class="basis-full shrink-0">
          <div class="relative w-full h-64 sm:h-80 md:h-96 overflow-hidden">
            <img :src="it.src" :alt="it.alt || ''" class="absolute inset-0 w-full h-full object-cover" loading="lazy" decoding="async" />
            <figcaption v-if="it.caption" class="absolute inset-x-0 bottom-0 p-4">
              <span class="inline-flex items-center rounded-lg bg-black/40 text-white backdrop-blur px-3 py-1 text-xs sm:text-sm">
                {{ it.caption }}
              </span>
            </figcaption>
          </div>
        </figure>
      </div>
    </div>

    <!-- Arrows -->
    <button
      v-if="showArrowsOn && slides.length > 1"
      type="button"
      class="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center rounded-full bg-background/80 dark:bg-background/60 ring-1 ring-black/10 dark:ring-white/10 w-9 h-9 shadow hover:scale-105 transition"
      aria-label="Previous" @click="prev">
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>
    <button
      v-if="showArrowsOn && slides.length > 1"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center rounded-full bg-background/80 dark:bg-background/60 ring-1 ring-black/10 dark:ring-white/10 w-9 h-9 shadow hover:scale-105 transition"
      aria-label="Next" @click="next">
      <svg viewBox="0 0 24 24" class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
    </button>

    <!-- Dots -->
    <div v-if="showDotsOn && slides.length > 1" class="mt-3 flex items-center justify-center gap-2">
      <button v-for="n in slides.length" :key="n" type="button"
        class="h-2.5 rounded-full transition-all"
        :class="n - 1 === idx ? 'w-6 bg-foreground/80' : 'w-2.5 bg-foreground/30 hover:bg-foreground/50'"
        :aria-label="`Go to slide ${n}`" @click="go(n - 1)" />
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  /** JSON array: [{src, alt?, caption?}, ...] OR a simple pipe list "/a.jpg|/b.jpg" */
  images:     { type: String, required: true },
  autoplay:   { type: [Boolean, String], default: true },
  interval:   { type: [Number, String], default: 5000 },
  loop:       { type: [Boolean, String], default: true },
  showDots:   { type: [Boolean, String], default: true },
  showArrows: { type: [Boolean, String], default: true },
})

const autoplayOn   = computed(() => props.autoplay   === '' || props.autoplay   === true || props.autoplay   === 'true')
const loopOn       = computed(() => props.loop       === '' || props.loop       === true || props.loop       === 'true')
const showDotsOn   = computed(() => props.showDots   === '' || props.showDots   === true || props.showDots   === 'true')
const showArrowsOn = computed(() => props.showArrows === '' || props.showArrows === true || props.showArrows === 'true')

const slides = computed(() => {
  const raw = (props.images || '').trim()
  if (!raw) return []
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.map(x => typeof x === 'string' ? { src: x } : x).filter(x => x.src) : []
  } catch { /* fallback to pipe list */ }
  return raw.split('|').map(s => ({ src: s.trim() })).filter(x => x.src)
})

const idx = ref(0)
const timer = ref(null)
const startX = ref(0)
const deltaX = ref(0)
const dragging = ref(false)

function go(n) {
  const len = slides.value.length
  if (!len) return
  idx.value = loopOn.value ? (n + len) % len : Math.max(0, Math.min(len - 1, n))
}
function next() { go(idx.value + 1) }
function prev() { go(idx.value - 1) }

function onDown(e) { dragging.value = true; startX.value = e.clientX; deltaX.value = 0 }
function onMove(e) { if (dragging.value) deltaX.value = e.clientX - startX.value }
function onUp() {
  if (!dragging.value) return
  const t = 50
  if (deltaX.value >  t) prev()
  if (deltaX.value < -t) next()
  dragging.value = false; deltaX.value = 0
}

function startAutoplay() {
  stopAutoplay()
  if (!autoplayOn.value || slides.value.length < 2) return
  const ms = Number(props.interval) || 5000
  timer.value = setInterval(next, ms)
}
function stopAutoplay() { if (timer.value) { clearInterval(timer.value); timer.value = null } }

onMounted(startAutoplay)
onBeforeUnmount(stopAutoplay)
watch([autoplayOn, () => props.interval, slides], startAutoplay)
</script>

