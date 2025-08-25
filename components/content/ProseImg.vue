<template>
  <DefineTemplate>
    <NuxtImg
      :src="refinedSrc"
      :alt
      :width
      :height
      class="rounded-md"
      :class="[
        lifted && 'rounded-lg border bg-card text-card-foreground shadow-xs',
        enableZoom && 'cursor-zoom-in',
        className,
      ]"
    />
  </DefineTemplate>

  <DialogRoot v-if="enableZoom" v-model:open="open">
    <DialogTrigger asChild>
      <button type="button" class="block w-full" aria-label="Open image in lightbox">
        <ReuseTemplate />
      </button>
    </DialogTrigger>

    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-black/80
               data-[state=open]:animate-in data-[state=open]:fade-in-0
               data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
        @click="open = false"
      />
      <DialogContent
        aria-label="Image lightbox"
        class="fixed left-1/2 top-1/2 z-50 grid p-0 outline-none
               -translate-x-1/2 -translate-y-1/2
               data-[state=open]:animate-in data-[state=open]:zoom-in-95 data-[state=open]:fade-in-0
               data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=closed]:fade-out-0
               sm:rounded-lg"
      >
        <!-- PAN CONTAINER -->
        <div
          ref="panRef"
          class="relative max-w-svw max-h-svh overflow-auto touch-pan-y"
          @wheel.passive="onWheel"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        >
          <!-- IMAGE: double-click/tap to toggle zoom -->
          <DialogClose asChild>
            <button
              type="button"
              aria-label="Close lightbox"
              class="p-0 m-0 block"
              @dblclick.stop.prevent="toggleZoom"
              @click.exact.stop="maybeToggleOnSingleClick"
            >
              <NuxtImg
                :src="refinedSrc"
                :alt
                :width
                :height
                class="md:rounded-lg select-none"
                :class="zoomLevel > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-out'"
                :style="{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: zoomAnimating ? 'transform 150ms ease-out' : 'none',
                  maxWidth: '100svw',
                  maxHeight: '100svh',
                  display: 'block',
                  margin: 'auto'
                }"
                draggable="false"
              />
            </button>
          </DialogClose>
        </div>

        <!-- Close button -->
        <DialogClose
          class="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-md
                 bg-black/60 text-white backdrop-blur hover:bg-black/70 focus:outline-none focus:ring"
          aria-label="Close"
        >
          ✕
        </DialogClose>

        <!-- Optional zoom controls -->
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 text-white rounded-md px-2 py-1">
          <button class="px-2" @click.stop="zoomOut">−</button>
          <span class="min-w-10 text-center text-sm">{{ zoomLevel.toFixed(2) }}×</span>
          <button class="px-2" @click.stop="zoomIn">+</button>
          <button class="px-2" @click.stop="resetZoom">Reset</button>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <ReuseTemplate v-else />
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref, computed, watch } from 'vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTrigger
} from 'reka-ui'
import { joinURL, withLeadingSlash, withTrailingSlash } from 'ufo'

const {
  src = '',
  alt = '',
  width,
  height,
  lifted = false,
  zoom = undefined,
  class: className = '',
  // NEW: control the zoom
  maxZoom = 2,         // how much bigger than fit
  minZoom = 1,         // never smaller than fit
  zoomStep = 0.15,     // wheel/btn increment
  singleClickToggles = false, // if true: single click toggles zoom (instead of dblclick)
} = defineProps<{
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
  lifted?: boolean
  zoom?: boolean
  class?: HTMLAttributes['class']
  maxZoom?: number
  minZoom?: number
  zoomStep?: number
  singleClickToggles?: boolean
}>()

const config = useConfig()
const open = ref(false)
const zoomLevel = ref(1)
const zoomAnimating = ref(false)
const panRef = ref<HTMLElement | null>(null)

// PAN state
const isPanning = ref(false)
const startPoint = ref({ x: 0, y: 0 })
const startScroll = ref({ left: 0, top: 0 })

const [DefineTemplate, ReuseTemplate] = createReusableTemplate()

const refinedSrc = computed(() => {
  if (src?.startsWith('/') && !src.startsWith('//')) {
    const _base = withLeadingSlash(withTrailingSlash(useRuntimeConfig().app.baseURL))
    if (_base !== '/' && !src.startsWith(_base)) return joinURL(_base, src)
  }
  return src
})

const enableZoom = computed(() => {
  if (zoom === undefined) return config.value.main.imageZoom
  return zoom
})

watch(open, (val) => {
  if (process.client) {
    document.documentElement.style.overflow = val ? 'hidden' : ''
  }
  // reset zoom when opening
  if (val) {
    zoomLevel.value = 1
    nextTick(() => panRef.value?.scrollTo({ left: 0, top: 0 }))
  }
})

// Zoom helpers
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(v, hi))
}
function setZoom(z: number, animate = true) {
  zoomAnimating.value = animate
  zoomLevel.value = clamp(z, minZoom, maxZoom)
  if (animate) {
    setTimeout(() => (zoomAnimating.value = false), 160)
  }
}
function zoomIn() {
  setZoom(zoomLevel.value + zoomStep)
}
function zoomOut() {
  setZoom(zoomLevel.value - zoomStep)
}
function resetZoom() {
  setZoom(1)
}
function toggleZoom() {
  setZoom(zoomLevel.value > 1 ? 1 : maxZoom)
}
// Single click optional toggle (mobile-friendly)
function maybeToggleOnSingleClick() {
  if (singleClickToggles) toggleZoom()
}

// Mouse wheel / trackpad pinch (browser sends wheel events)
function onWheel(e: WheelEvent) {
  if (!open.value) return
  if (!e.ctrlKey && Math.abs(e.deltaY) < 2) return
  e.preventDefault()
  const direction = e.deltaY > 0 ? -1 : 1
  setZoom(zoomLevel.value + direction * zoomStep, false)
}

// Pointer pan (when zoomed in)
function onPointerDown(e: PointerEvent) {
  if (zoomLevel.value <= 1) return
  const el = panRef.value
  if (!el) return
  isPanning.value = true
  ;(e.target as Element).setPointerCapture?.(e.pointerId)
  startPoint.value = { x: e.clientX, y: e.clientY }
  startScroll.value = { left: el.scrollLeft, top: el.scrollTop }
}
function onPointerMove(e: PointerEvent) {
  if (!isPanning.value || zoomLevel.value <= 1) return
  const el = panRef.value
  if (!el) return
  const dx = e.clientX - startPoint.value.x
  const dy = e.clientY - startPoint.value.y
  el.scrollTo({ left: startScroll.value.left - dx, top: startScroll.value.top - dy })
}
function onPointerUp(e: PointerEvent) {
  isPanning.value = false
}
</script>


