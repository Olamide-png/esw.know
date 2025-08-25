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
    <!-- Trigger: reuse the exact same image -->
    <DialogTrigger asChild>
      <button
        type="button"
        class="block w-full"
        aria-label="Open image in lightbox"
      >
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
        <!-- Close on click of the image -->
        <DialogClose asChild>
          <button type="button" aria-label="Close lightbox" class="p-0 m-0">
            <NuxtImg
              :src="refinedSrc"
              :alt
              :width
              :height
              class="cursor-zoom-out md:rounded-lg max-w-svw max-h-svh"
            />
          </button>
        </DialogClose>

        <!-- Optional explicit close button (top-right) -->
        <DialogClose
          class="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-md
                 bg-black/60 text-white backdrop-blur hover:bg-black/70 focus:outline-none focus:ring"
          aria-label="Close"
        >
          ✕
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>

  <!-- No zoom: render plain image -->
  <ReuseTemplate v-else />
</template>

<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { ref, computed } from 'vue'
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
} = defineProps<{
  src?: string
  alt?: string
  width?: string | number
  height?: string | number
  lifted?: boolean
  zoom?: boolean
  class?: HTMLAttributes['class']
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

// Optional: lock body scroll while lightbox open
watch(open, (val) => {
  if (process.client) {
    document.documentElement.style.overflow = val ? 'hidden' : ''
  }
})
</script>

