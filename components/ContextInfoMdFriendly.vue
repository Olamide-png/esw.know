<template>
  <span class="inline">
    <!-- Trigger (uses default slot as the anchor text) -->
    <button
      type="button"
      class="cursor-help underline decoration-dotted underline-offset-2 hover:opacity-80 focus:outline-none focus:ring focus:ring-primary/40 rounded"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="panelId"
      @click="open = true"
    >
      <slot />
    </button>

    <!-- Overlay -->
    <Teleport to="body">
      <transition enter-active-class="transition-opacity duration-200" enter-from-class="opacity-0" enter-to-class="opacity-100"
                  leave-active-class="transition-opacity duration-150" leave-from-class="opacity-100" leave-to-class="opacity-0">
        <div v-if="open" class="fixed inset-0 z-[1000] bg-black/40" aria-hidden="true" @click="close()" />
      </transition>

      <!-- Left drawer -->
      <transition enter-active-class="transform transition duration-300 ease-out" enter-from-class="-translate-x-full" enter-to-class="translate-x-0"
                  leave-active-class="transform transition duration-200 ease-in" leave-from-class="translate-x-0" leave-to-class="-translate-x-full">
        <aside v-if="open" :id="panelId"
               class="fixed top-0 left-0 z-[1001] h-dvh w-[min(92vw,420px)] sm:w-[420px] bg-background text-foreground shadow-xl border-r border-border flex flex-col"
               role="dialog" :aria-label="title" aria-modal="true" @keydown.esc.prevent.stop="close()" ref="panelEl">
          <header class="flex items-start gap-3 p-4 border-b border-border">
            <h2 class="text-base font-semibold leading-6">{{ title }}</h2>
            <p v-if="description" class="text-sm text-muted-foreground ml-auto max-w-[55%]">{{ description }}</p>
            <button ref="closeBtn" @click="close()" class="ml-2 rounded p-2 text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></svg>
            </button>
          </header>

          <main class="p-4 overflow-y-auto grow prose dark:prose-invert max-w-none">
            <!-- Prefer front-matter panel by key -->
            <ContentRendererMarkdown v-if="resolvedMarkdown" :value="resolvedMarkdown" />
            <!-- or fall back to inline HTML string -->
            <div v-else v-html="panelHtml"></div>
          </main>

          <footer class="p-4 border-t border-border">
            <button class="rounded px-3 py-2 text-sm bg-muted hover:bg-muted/80" @click="close()">Close</button>
          </footer>
        </aside>
      </transition>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useContent } from '#imports' // from @nuxt/content

const props = withDefaults(defineProps<{
  title: string
  description?: string
  /** Prefer this: key in page front-matter -> contextPanels[key] (markdown string) */
  panelKey?: string
  /** Fallback: raw HTML string (Markdown not parsed) */
  panelHtml?: string
  id?: string
}>(), {})

const open = ref(false)
const panelEl = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
const panelId = computed(() => props.id ?? `ctx-${Math.random().toString(36).slice(2, 8)}`)

const { page } = useContent()
const resolvedMarkdown = computed(() => {
  const panels = (page.value as any)?.contextPanels
  return props.panelKey && panels ? panels[props.panelKey] : ''
})

function lockScroll(lock: boolean) {
  document.documentElement.style.overflow = lock ? 'hidden' : ''
}
function close() { open.value = false }

watch(open, async (val) => {
  lockScroll(val)
  if (val) {
    await nextTick()
    closeBtn.value?.focus()
  }
})

function trapFocus(e: FocusEvent) {
  if (!open.value || !panelEl.value) return
  const focusable = panelEl.value.querySelectorAll<HTMLElement>('a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])')
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const t = e.target as HTMLElement
  if (!panelEl.value.contains(t)) first.focus()
}
onMounted(() => document.addEventListener('focusin', trapFocus))
onBeforeUnmount(() => {
  lockScroll(false)
  document.removeEventListener('focusin', trapFocus)
})
</script>

