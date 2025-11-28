<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useContent } from '#imports'  // ✅ make it explicit

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

/* ✅ useContent() is auto-imported by @nuxt/content */
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
  if (val) { await nextTick(); closeBtn.value?.focus() }
})

function trapFocus(e: FocusEvent) {
  if (!open.value || !panelEl.value) return
  const focusable = panelEl.value.querySelectorAll<HTMLElement>(
    'a[href], button, textarea, input, select, [tabindex]:not([tabindex="-1"])'
  )
  if (!focusable.length) return
  const first = focusable[0]
  const t = e.target as HTMLElement
  if (!panelEl.value.contains(t)) first.focus()
}
onMounted(() => document.addEventListener('focusin', trapFocus))
onBeforeUnmount(() => {
  lockScroll(false)
  document.removeEventListener('focusin', trapFocus)
})
</script>
