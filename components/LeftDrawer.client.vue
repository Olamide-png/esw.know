<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  /** trigger type */
  as?: 'button' | 'link'
  /** trigger label text */
  label?: string
  /** width of the drawer */
  width?: 'sm' | 'md' | 'lg' | 'xl'
  /** dim the page behind the drawer */
  overlay?: boolean
  /** start open (useful for testing) */
  openByDefault?: boolean
}>(), {
  as: 'button',
  label: 'Open drawer',
  width: 'md',
  overlay: false,       // <- default: does NOT cover the whole page
  openByDefault: false
})

const open = ref(!!props.openByDefault)
const panel = ref<HTMLElement | null>(null)

const widths: Record<string, string> = {
  sm: 'w-72',            // 18rem
  md: 'w-96',            // 24rem
  lg: 'w-[32rem]',
  xl: 'w-[36rem]'
}

function lockScroll(lock: boolean) {
  // Light scroll lock (only if overlay is used)
  if (!props.overlay) return
  document.documentElement.style.overflow = lock ? 'hidden' : ''
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

function openDrawer() {
  open.value = true
  nextTick(() => panel.value?.focus())
}

function closeDrawer() {
  open.value = false
}

watch(open, (v) => lockScroll(v))

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
  lockScroll(false)
})
</script>

<template>
  <!-- Trigger -->
  <button
    v-if="as === 'button'"
    type="button"
    class="inline-flex items-center gap-2 rounded-2xl border bg-background px-4 py-2 text-sm font-medium shadow-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-2"
    @click="openDrawer"
  >
    {{ label }}
  </button>

  <a
    v-else
    href="#"
    class="text-primary underline underline-offset-4 hover:no-underline"
    @click.prevent="openDrawer"
  >
    {{ label }}
  </a>

  <!-- Portal -->
  <Teleport to="body">
    <!-- Optional overlay (doesn't block layout; you can enable/disable via prop) -->
    <div
      v-show="overlay && open"
      class="fixed inset-0 z-40 bg-black/30"
      aria-hidden="true"
      @click="closeDrawer"
    />

    <!-- Drawer panel -->
    <div
      class="fixed inset-y-0 left-0 z-50 flex outline-none"
      :class="open ? '' : 'pointer-events-none'"
      role="dialog"
      aria-modal="true"
      aria-label="Drawer"
    >
      <div
        ref="panel"
        tabindex="-1"
        class="h-full bg-background shadow-xl border-r transition-transform duration-300 ease-in-out focus:outline-none"
        :class="[
          widths[width],
          open ? 'translate-x-0' : '-translate-x-full'
        ]"
      >
        <!-- Header -->
        <div class="flex items-start gap-2 border-b p-4">
          <div class="min-w-0">
            <p v-if="title" class="text-base font-semibold truncate">{{ title }}</p>
            <p v-if="description" class="text-sm text-muted-foreground truncate">
              {{ description }}
            </p>
          </div>
          <button
            class="ml-auto rounded-full border px-2 py-1 text-sm leading-none hover:bg-muted"
            @click="closeDrawer"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <!-- Body -->
        <div class="h-[calc(100%-56px)] overflow-y-auto p-4">
          <slot />
        </div>
      </div>
    </div>
  </Teleport>
</template>
