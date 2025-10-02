<!-- components/FlickeringGrid.vue -->
<template>
  <div
    ref="containerRef"
    :class="cn('relative w-full h-full', props.class)"
    aria-hidden="true"
  >
    <!-- Full-bleed canvas background -->
    <canvas
      ref="canvasRef"
      class="pointer-events-none absolute inset-0 block"
      :width="canvasPixelSize.width"
      :height="canvasPixelSize.height"
      :style="{
        width: canvasCssSize.width + 'px',
        height: canvasCssSize.height + 'px'
      }"
    />
    <!-- Slot (optional) if you ever want to place children inside -->
    <slot />
  </div>
</template>

<script lang="ts" setup>
import { cn } from '@/lib/utils'
import { ref, onMounted, onBeforeUnmount, toRefs, computed } from 'vue'

interface FlickeringGridProps {
  squareSize?: number
  gridGap?: number
  /** Probability/sec a tile re-randomizes. Example: 0.3 = ~30% per second */
  flickerChance?: number
  /** Accepts #RRGGBB, rgb(), hsl(), or CSS var like var(--primary) */
  color?: string
  /** Maximum fill opacity per tile (0..1) */
  maxOpacity?: number
  /** Optional fixed width/height in CSS pixels; otherwise container size */
  width?: number
  height?: number
  class?: string
}

const props = withDefaults(defineProps<FlickeringGridProps>(), {
  squareSize: 4,
  gridGap: 6,
  flickerChance: 0.3,
  color: '#22d3ee',   // tailwind cyan-400-ish
  maxOpacity: 0.28
})

const { squareSize, gridGap, flickerChance, color, maxOpacity, width, height } = toRefs(props)

const containerRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)

const isInView = ref(false)
const reduceMotion = ref(false)

/** canvas size tracking: CSS pixels vs device pixels */
const canvasCssSize = ref({ width: 0, height: 0 })
const canvasPixelSize = ref({ width: 0, height: 0 })

/** grid model */
const cols = ref(0)
const rows = ref(0)
let squares = new Float32Array(0)
let dpr = 1

/** Parse color into rgba(r,g,b,alpha) base prefix, handling hex/rgb/hsl/var() */
const rgbaPrefix = computed(() => {
  const c = color.value?.trim() ?? '#000000'
  // If it's a var()/rgb()/hsl() already, defer alpha with ' / ' for modern CSS
  if (c.startsWith('var(')) return `${c.replace(/\)$/, '')} /`   // var(--color) /
  if (c.startsWith('rgb(') || c.startsWith('hsl(')) return `${c.replace(/\)$/, '')},`
  // Hex to rgb
  const hex = c.replace(/^#/, '')
  const full = hex.length === 3
    ? hex.split('').map(ch => ch + ch).join('')
    : hex.padEnd(6, '0').slice(0, 6)
  const r = parseInt(full.slice(0, 2), 16)
  const g = parseInt(full.slice(2, 4), 16)
  const b = parseInt(full.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b},`
})

function setupCanvas(target: HTMLCanvasElement, cssW: number, cssH: number) {
  dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
  canvasCssSize.value = { width: cssW, height: cssH }
  canvasPixelSize.value = { width: Math.floor(cssW * dpr), height: Math.floor(cssH * dpr) }

  target.width = canvasPixelSize.value.width
  target.height = canvasPixelSize.value.height

  const colCount = Math.max(1, Math.floor(cssW / (squareSize.value + gridGap.value)))
  const rowCount = Math.max(1, Math.floor(cssH / (squareSize.value + gridGap.value)))
  cols.value = colCount
  rows.value = rowCount

  squares = new Float32Array(colCount * rowCount)
  for (let i = 0; i < squares.length; i++) {
    squares[i] = Math.random() * maxOpacity.value
  }
}

function updateSquares(deltaSec: number) {
  // lower activity when reduced motion
  const chance = (reduceMotion.value ? flickerChance.value * 0.15 : flickerChance.value) * deltaSec
  for (let i = 0; i < squares.length; i++) {
    if (Math.random() < chance) {
      squares[i] = Math.random() * maxOpacity.value
    }
  }
}

function draw() {
  if (!ctx.value || !canvasRef.value) return
  const c = ctx.value
  const W = canvasPixelSize.value.width
  const H = canvasPixelSize.value.height

  c.clearRect(0, 0, W, H)

  // Optional subtle fade background: comment out if not desired
  c.fillStyle = 'transparent'
  c.fillRect(0, 0, W, H)

  const step = (squareSize.value + gridGap.value) * dpr
  const size = squareSize.value * dpr

  for (let i = 0; i < cols.value; i++) {
    const x = Math.round(i * step)
    for (let j = 0; j < rows.value; j++) {
      const opacity = squares[i * rows.value + j]
      if (opacity <= 0.002) continue
      c.fillStyle = `${rgbaPrefix.value} ${opacity})` // supports rgba(...,α) and var(... / α)
      c.fillRect(Math.round(x), Math.round(j * step), size, size)
    }
  }
}

let raf = 0
let last = 0

function loop(now: number) {
  if (!isInView.value || reduceMotion.value) return
  const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
  last = now
  updateSquares(dt)
  draw()
  raf = requestAnimationFrame(loop)
}

function resize() {
  if (!containerRef.value || !canvasRef.value) return
  const cssW = width.value || containerRef.value.clientWidth
  const cssH = height.value || containerRef.value.clientHeight
  setupCanvas(canvasRef.value, cssW, cssH)
  // Redraw immediately to avoid blank during resize
  draw()
}

let ro: ResizeObserver | null = null
let io: IntersectionObserver | null = null

onMounted(() => {
  reduceMotion.value = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false

  if (!canvasRef.value) return
  ctx.value = canvasRef.value.getContext('2d')

  resize()

  ro = new ResizeObserver(() => resize())
  ro.observe(containerRef.value!)

  // Observe the container (more stable than canvas)
  io = new IntersectionObserver(([entry]) => {
    isInView.value = entry.isIntersecting
    cancelAnimationFrame(raf)
    last = performance.now()
    if (isInView.value && !reduceMotion.value) {
      raf = requestAnimationFrame(loop)
    }
  }, { threshold: 0 })
  io.observe(containerRef.value!)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  ro?.disconnect()
  io?.disconnect()
})
</script>
