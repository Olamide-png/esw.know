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
        <!-- No pan container; just the image scaled -->
        <DialogClose asChild>
          <button type="button" aria-label="Close lightbox" class="p-0 m-0 block">
            <NuxtImg
              :src="refinedSrc"
              :alt
              :width
              :height
              class="md:rounded-lg cursor-zoom-out select-none"
              :style="{
                /* Fit to viewport first... */
                maxWidth: '100svw',
                maxHeight: '100svh',
                display: 'block',
                margin: 'auto',
                /* ...then scale beyond fit */
                transform: `scale(${zoomFactor})`,
                transformOrigin: 'center center',
                transition: 'transform 150ms ease-out'
              }"
              draggable="false"
            />
          </button>
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <ReuseTemplate v-else />
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref, computed, watch } from 'vue'
import {
  DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogRoot, DialogTrigger
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
  zoomFactor = 1.5, // 👈 how much larger than fit (try 2 for 2×)
} = defineProps<{
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
  lifted?: boolean
  zoom?: boolean
  class?: HTMLAttributes['class']
  zoomFactor?: number
}>()

const config = useConfig()
const open = ref(false)

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
  if (process.client) document.documentElement.style.overflow = val ? 'hidden' : ''
})
</script>



