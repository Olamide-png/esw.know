<template>
  <span class="inline">
    <!-- Trigger wraps your anchor text -->
    <button
      type="button"
      class="cursor-help underline decoration-dotted underline-offset-2 hover:opacity-80 focus:outline-none focus:ring focus:ring-primary/40 rounded"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="panelId"
      @click="open = true"
    >
      <slot name="anchor" />
    </button>

    <!-- Teleport overlay + panel -->
    <Teleport to="body">
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
          class="fixed inset-0 z-[1000] bg-black/40"
          aria-hidden="true"
          @click="close()"
        />
      </transition>

      <transition
        enter-active-class="transform transition duration-300 ease-out"
        enter-from-class="-translate-x-full"
        enter-to-class="translate-x-0"
        leave-active-class="transform transition duration-200 ease-in"
        leave-from-class="translate-x-0"
        leave-to-class="-translate-x-full"
      >
        <aside
          v-if="open"
          :id="panelId"
          class="fixed top-0 left-0 z-[1001] h-dvh w-[min(92vw,420px)] sm:w-[420px] bg-background text-foreground shadow-xl border-r border-border flex flex-col"
          role="dialog"
          :aria-label="title"
          aria-modal="true"
          @keydown.esc.prevent.stop="close()"
          ref="panelEl"
        >
          <header class="flex items-start gap-3 p-4 border-b border-border">
            <h2 class="text-base font-semibold leading-6">{{ title }}</h2>
            <p v-if="description" class="text-sm text-muted-foreground ml-auto max-w-[55%]">
              {{ description }}
            </p>
            <button
              ref="closeBtn"
              @click="close()"
              class="ml-2 rounded p-2 text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Close"
            >
              <!-- x icon -->
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/>
              </svg>
            </button>
          </header>

          <main class="p-4 overflow-y-auto grow prose dark:prose-invert max-w-none">
            <slot name="panel" />
          </main>

          <footer class="p-4 border-t border-border">
            <button
              class="rounded px-3 py-2 text-sm bg-muted hover:bg-muted/80"
              @click="close()"
            >
              Close
            </button>
          </footer>
        </aside>
      </transition>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, computed, nextTick } from 'vue'

const props = defineProps<{
  title: string
  description?: string
  id?: string
}>()

const open = ref(false)
const panelEl = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
const panelId = computed(() => props.id ?? `ctx-${Math.random().toString(36).slice(2, 8)}`)

function lockScroll(lock: boolean) {
  if (lock) {
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.documentElement.style.overflow = ''
  }
}

function trapFocus(e: FocusEvent) {
  if (!open.value || !panelEl.value) return
  const focusable = panelEl.value.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const target = e.target as HTMLElement
  // If focus left the panel, bring it back to first
  if (!panelEl.value.contains(target)) first.focus()
}

function close() { open.value = false }

watch(open, async (val) => {
  lockScroll(val)
  if (val) {
    await nextTick()
    // focus close button for accessibility
    closeBtn.value?.focus()
  }
})

onMounted(() => {
  document.addEventListener('focusin', trapFocus)
})
onBeforeUnmount(() => {
  lockScroll(false)
  document.removeEventListener('focusin', trapFocus)
})
</script>
