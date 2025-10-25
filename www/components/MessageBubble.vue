<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue'

const props = defineProps<{ role: 'user'|'assistant'|'system'; content: string }>()

/* ---------- helpers ---------- */
const rootEl = ref<HTMLElement | null>(null)
function escapeHtml(s: string) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}
function safeUrl(u: string) {
  try {
    const url = new URL(u, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
    return ['http:','https:','mailto:'].includes(url.protocol) ? url.href : '#'
  } catch { return '#' }
}

/* ---------- light markdown (theme-friendly) ---------- */
function renderMarkdown(src: string) {
  let s = escapeHtml(src ?? '').replace(/\r\n?/g, '\n')

  // fenced code ```lang\n...\n```
  s = s.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang = '', code = '') => {
    const c = escapeHtml(code)
    const l = String(lang).toLowerCase().trim()
    return `
      <div class="relative group border rounded-lg overflow-hidden bg-muted/70">
        <button type="button"
          class="absolute right-2 top-2 text-xs px-2 py-1 rounded-md border bg-background/80
                 opacity-0 group-hover:opacity-100 transition"
          data-copy="block">Copy</button>
        <pre class="overflow-x-auto text-[13px] leading-6 p-3 m-0"><code class="language-${l}">${c}</code></pre>
      </div>`
  })

  // inline code
  s = s.replace(/`([^`\n]+)`/g, (_m, code) => `<code class="rounded bg-muted px-1 py-0.5 text-[12px] border">${code}</code>`)

  // headings
  s = s.replace(/^(#{1,6})\s+(.+)$/gm, (_m, hashes: string, text: string) => {
    const level = Math.min(6, hashes.length)
    const sizes = ['text-2xl','text-xl','text-lg','text-base','text-sm','text-xs']
    return `<h${level} class="font-semibold ${sizes[level-1]} mt-3 mb-2">${text}</h${level}>`
  })

  // links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    const u = safeUrl(url)
    return `<a href="${u}" target="_blank" rel="noopener" class="underline decoration-dotted underline-offset-2">${escapeHtml(text)}</a>`
  })

  // basic lists
  s = s.replace(/(?:^|\n)([-*])\s+([^\n]+)(?=(\n[-*]\s+)|\n\n|$)/g, (_m, _b, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, (m) => `<ul class="list-disc pl-5 space-y-1">${m}</ul>`)
  s = s.replace(/(?:^|\n)(\d+)\.\s+([^\n]+)(?=(\n\d+\.\s+)|\n\n|$)/g, (_m, _n, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, (m) => m.includes('<ul') ? m : `<ol class="list-decimal pl-5 space-y-1">${m}</ol>`)

  // paragraphs
  s = s.split(/\n{2,}/).map(block => {
    if (/^\s*<(h\d|ul|ol|div|pre)/i.test(block)) return block
    return `<p class="leading-7">${block.replace(/\n/g,'<br>')}</p>`
  }).join('\n')

  return s
}

const html = computed(() => renderMarkdown(props.content ?? ''))

/* ---------- generative UI ---------- */
/** Extract first ```ui ...``` fenced block and parse JSON */
const uiSpec = computed<any | null>(() => {
  const m = props.content?.match(/```ui\s*?\n([\s\S]*?)```/i)
  if (!m) return null
  try { return JSON.parse(m[1]) } catch { return null }
})

/* copy whole bubble */
async function copyWhole() { try { await navigator.clipboard.writeText(props.content || '') } catch {} }

/* wire per-block copy buttons */
function wireCopyButtons() {
  const el = rootEl.value; if (!el) return
  el.querySelectorAll<HTMLButtonElement>('button[data-copy="block"]').forEach(btn => {
    btn.onclick = async () => {
      const pre = btn.parentElement?.querySelector('pre'); const text = pre?.innerText || ''
      try { await navigator.clipboard.writeText(text); btn.textContent = 'Copied'; setTimeout(() => (btn.textContent = 'Copy'), 1200) } catch {}
    }
  })
}
onMounted(wireCopyButtons)
onUpdated(wireCopyButtons)

/* map variants to shadcn docs alert variants */
function mapAlertVariant(v?: string) {
  if (!v) return 'default'
  const k = v.toLowerCase()
  if (k === 'danger' || k === 'error' || k === 'destructive') return 'destructive'
  return 'default'
}
</script>

<template>
  <div class="flex items-start gap-2 text-sm">
    <span class="mt-1 shrink-0">
      <Icon v-if="role==='assistant'" name="lucide:bot" class="h-5 w-5 opacity-80" />
      <Icon v-else-if="role==='user'" name="lucide:user" class="h-5 w-5 opacity-80" />
      <Icon v-else name="lucide:info" class="h-5 w-5 opacity-80" />
    </span>

    <div
      :class="role==='user' ? 'bg-primary text-primary-foreground' : 'bg-muted/60'"
      class="relative rounded-2xl px-3 py-2 w-full"
      ref="rootEl"
    >
      <!-- copy whole -->
      <div v-if="role==='assistant'" class="absolute right-2 top-2">
        <button
          type="button"
          class="rounded-md border bg-background/80 px-2 py-1 text-xs shadow hover:shadow-md"
          @click="copyWhole"
          title="Copy message"
        >
          Copy
        </button>
      </div>

      <!-- prose answer -->
      <div v-if="role!=='user'" class="prose prose-sm max-w-none dark:prose-invert" v-html="html" />
      <div v-else class="whitespace-pre-wrap">{{ content }}</div>

      <!-- Generative UI (uses shadcn-docs-nuxt Ui* components) -->
      <div v-if="uiSpec" class="mt-3 space-y-3">
        <!-- CARDS -->
        <div v-if="uiSpec.type === 'cards'" class="grid grid-cols-1 gap-3">
          <UiCard v-for="(c, i) in uiSpec.cards || []" :key="i" class="hover:shadow-sm transition">
            <UiCardHeader class="pb-2">
              <UiCardTitle class="text-base">{{ c.title }}</UiCardTitle>
              <p v-if="c.subtitle" class="text-xs text-muted-foreground">{{ c.subtitle }}</p>
            </UiCardHeader>
            <UiCardContent class="pt-0">
              <p v-if="c.description" class="text-sm mb-2">{{ c.description }}</p>
              <NuxtLink v-if="c.href" :to="c.href" class="inline-flex items-center gap-1 text-sm underline">
                Visit <Icon name="lucide:arrow-up-right" class="w-3.5 h-3.5" />
              </NuxtLink>
            </UiCardContent>
          </UiCard>
        </div>

        <!-- STEPS -->
        <div v-else-if="uiSpec.type === 'steps'">
          <ol class="space-y-2">
            <li v-for="(s,i) in uiSpec.items || []" :key="i" class="flex items-start gap-3">
              <UiBadge variant="outline" class="rounded-full min-w-6 h-6 flex items-center justify-center text-xs">{{ i+1 }}</UiBadge>
              <span class="leading-6">{{ s }}</span>
            </li>
          </ol>
        </div>

        <!-- CALLOUT -->
        <UiAlert v-else-if="uiSpec.type === 'callout'" :variant="mapAlertVariant(uiSpec.variant)">
          <UiAlertTitle v-if="uiSpec.title">{{ uiSpec.title }}</UiAlertTitle>
          <UiAlertDescription v-if="uiSpec.body">{{ uiSpec.body }}</UiAlertDescription>
        </UiAlert>

        <!-- KPIS -->
        <div v-else-if="uiSpec.type === 'kpis'" class="grid grid-cols-2 gap-3">
          <UiCard v-for="(k,i) in uiSpec.items || []" :key="i">
            <UiCardContent class="py-3">
              <div class="text-2xl font-semibold">{{ k.value }}</div>
              <div class="text-xs text-muted-foreground mt-0.5">{{ k.label }}</div>
            </UiCardContent>
          </UiCard>
        </div>

        <!-- TABLE -->
        <div v-else-if="uiSpec.type === 'table'" class="overflow-x-auto">
          <UiTable>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead v-for="(h,i) in uiSpec.headers || []" :key="i">{{ h }}</UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              <UiTableRow v-for="(row,ri) in uiSpec.rows || []" :key="ri">
                <UiTableCell v-for="(cell,ci) in row" :key="ci">{{ cell }}</UiTableCell>
              </UiTableRow>
            </UiTableBody>
          </UiTable>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose :where(pre){ background: transparent; }
</style>









