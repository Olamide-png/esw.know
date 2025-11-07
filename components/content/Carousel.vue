<template>
  <section class="relative w-full">
    <div
      class="overflow-hidden rounded-2xl ring-1 ring-black/5 dark:ring-white/10 bg-white/60 dark:bg-white/5 backdrop-blur"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
    >
      <div
        ref="track"
        class="flex transition-transform duration-500 ease-out"
        :style="{ transform: `translateX(-${index * 100}%)` }"
      >
        <slot />
      </div>
    </div>

    <!-- Arrows -->
    <button
      v-if="showArrowsOn"
      type="button"
      class="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center rounded-full bg-background/80 dark:bg-background/60 ring-1 ring-black/10 dark:ring-white/10 w-9 h-9 shadow hover:scale-105 transition"
      aria-label="Previous slide"
      @click="prev"
    >
      <i class="i-lucide-chevron-left w-5 h-5" />
    </button>

    <button
      v-if="showArrowsOn"
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center rounded-full bg-background/80 dark:bg-background/60 ring-1 ring-black/10 dark:ring-white/10 w-9 h-9 shadow hover:scale-105 transition"
      aria-label="Next slide"
      @click="next"
    >
      <i class="i-lucide-chevron-right w-5 h-5" />
    </button>

    <!-- Dots -->
    <div v-if="showDotsOn" class="mt-3 flex items-center justify-center gap-2">
      <button
        v-for="n in slideCount"
        :key="n"
        type="button"
        class="h-2.5 rounded-full transition-all"
        :class="n - 1 === index ? 'w-6 bg-foreground/80' : 'w-2.5 bg-foreground/30 hover:bg-foreground/50'"
        :aria-label="`Go to slide ${n}`"
        @click="go(n - 1)"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

/**
 * Props are MDC-friendly: boolean attrs are true when present
 */
const props = defineProps({
  autoplay:   { type: [Boolean, String], default: true },
  interval:   { type: [Number, String], default: 5000 },
  loop:       { type: [Boolean, String], default: true },
  showDots:   { type: [Boolean, String], default: true },
  showArrows: { type: [Boolean, String], default: true },
})

const autoplayOn = computed(() => props.autoplay === '' || props.autoplay === true || props.autoplay === 'true')
const loopOn     = computed(() => props.loop     === '' || props.loop     === true || props.loop     === 'true')
const showDotsOn = computed(() => props.showDots === '' || props.showDots === true || props.showDots === 'true')
const showArrowsOn = computed(() => props.showArrows === '' || props.showArrows === true || props.showArrows === 'true')

const track = ref(null)
const index = ref(0)
const timer = ref(null)
const startX = ref(0)
const deltaX = ref(0)
const dragging = ref(false)

const slideCount = computed(() => {
  // count direct children projected into the slot
  const el = track.value
  if (!el) return 0
  // Each CarouselItem is a block with basis-full shrink-0; count those
  return el.children?.length || 0
})

function go(n) {
  if (slideCount.value === 0) return
  if (loopOn.value) {
    index.value = (n + slideCount.value) % slideCount.value
  } else {
    index.value = Math.max(0, Math.min(slideCount.value - 1, n))
  }
}

function next() { go(index.value + 1) }
function prev() { go(index.value - 1) }

function onPointerDown(e) {
  dragging.value = true
  startX.value = e.clientX
  deltaX.value = 0
}
function onPointerMove(e) {
  if (!dragging.value) return
  deltaX.value = e.clientX - startX.value
}
function onPointerUp() {
  if (!dragging.value) return
  const threshold = 50 // px
  if (deltaX.value > threshold) prev()
  else if (deltaX.value < -threshold) next()
  dragging.value = false
  deltaX.value = 0
}

function startAutoplay() {
  stopAutoplay()
  if (!autoplayOn.value || slideCount.value < 2) return
  const ms = Number(props.interval) || 5000
  timer.value = setInterval(next, ms)
}
function stopAutoplay() {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

onMounted(() => {
  startAutoplay()
  // keyboard support
  const keyHandler = (e) => {
    if (e.key === 'ArrowLeft') prev()
    if (e.key === 'ArrowRight') next()
  }
  window.addEventListener('keydown', keyHandler)
  onBeforeUnmount(() => window.removeEventListener('keydown', keyHandler))
})
onBeforeUnmount(stopAutoplay)

watch([autoplayOn, () => props.interval, slideCount], startAutoplay)
</script>
