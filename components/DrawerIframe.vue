<template>
  <Teleport to="body">
    <!-- Overlay -->
    <transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[60] bg-black/50"
        @click="close"
        aria-hidden="true"
      />
    </transition>

    <!-- Drawer -->
    <transition
      enter-active-class="transform transition duration-300"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition duration-200"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <section
        v-if="open"
        class="fixed inset-y-0 right-0 z-[61] w-full max-w-[min(100vw,42rem)] bg-background text-foreground shadow-xl flex flex-col"
        role="dialog"
        :aria-label="title || 'Embedded content drawer'"
        aria-modal="true"
        ref="panelRef"
      >
        <!-- Header -->
        <header class="flex items-center gap-3 p-4 border-b">
          <h2 class="text-base font-medium truncate">{{ title }}</h2>
          <span v-if="origin" class="ml-auto text-xs text-muted-foreground truncate">
            {{ origin }}
          </span>
          <button
            ref="closeBtnRef"
            @click="close"
            class="ml-2 inline-flex items-center rounded-md border px-2.5 py-1.5 text-sm hover:bg-muted"
          >
            Close
          </button>
        </header>

        <!-- Body -->
        <div class="relative flex-1">
          <!-- Loading state -->
          <div
            v-if="loading"
            class="absolute inset-0 grid place-items-center"
            aria-live="polite"
          >
            <div class="animate-pulse text-sm">Loading…</div>
          </div>

          <iframe
            :src="src"
            :title="title || 'Embedded content'"
            class="w-full h-full border-0"
            :allowfullscreen="allowFullScreen ? true : undefined"
            :sandbox="sandbox || undefined"
            ref="iframeRef"
            @load="onLoad"
          ></iframe>
        </div>
      </section>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps<{
  open: boolean
  src: string
  title?: string
  allowFullScreen?: boolean
  sandbox?: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'loaded'): void
}>()

const panelRef = ref<HTMLElement | null>(null)
const closeBtnRef = ref<HTMLButtonElement | null>(null)
const iframeRef = ref<HTMLIFrameElement | null>(null)
const loading = ref(true)
let previouslyFocused: Element | null = null

const origin = computed(() => {
  try {
    const u = new URL(props.src)
    return u.hostname
  } catch { return '' }
})

function close() {
  emit('update:open', false)
}

function onKeydown(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
  }
}

function onLoad() {
  loading.value = false
  emit('loaded')
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      loading.value = true
      previouslyFocused = document.activeElement
      // prevent background scroll
      document.documentElement.classList.add('overflow-hidden')
      // move focus to the close button for accessibility
      requestAnimationFrame(() => closeBtnRef.value?.focus())
      window.addEventListener('keydown', onKeydown)
    } else {
      document.documentElement.classList.remove('overflow-hidden')
      window.removeEventListener('keydown', onKeydown)
      // return focus to the trigger element
      if (previouslyFocused instanceof HTMLElement) {
        previouslyFocused.focus()
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  // No-op; handled via watch
})

onBeforeUnmount(() => {
  document.documentElement.classList.remove('overflow-hidden')
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* Light/dark tokens if you’re using Tailwind CSS variables; otherwise remove */
:root {
  --bg: 255 255 255;
  --fg: 17 24 39;
}
.bg-background { background-color: rgb(var(--bg)); }
.text-foreground { color: rgb(var(--fg)); }
.text-muted-foreground { color: rgba(var(--fg), 0.6); }
.hover\:bg-muted:hover { background-color: rgba(var(--fg), 0.06); }
.border-b { border-bottom: 1px solid rgba(0,0,0,.08); }
@media (prefers-color-scheme: dark) {
  :root {
    --bg: 17 24 39;
    --fg: 241 245 249;
  }
  .border-b { border-bottom-color: rgba(255,255,255,.12); }
}
</style>
