<!-- components/MessageBubble.vue -->
<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue'

const props = defineProps<{ role: 'user'|'assistant'|'system'; content: string }>()

/* single root ref (used for copy buttons) */
const rootEl = ref<HTMLElement | null>(null)

/* ---------- helpers ---------- */
function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
function safeUrl(u: string) {
  try {
    const url = new URL(u, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
    const allowed = ['http:', 'https:', 'mailto:']
    return allowed.includes(url.protocol) ? url.href : '#'
  } catch { return '#' }
}

/* Tiny markdown -> HTML (safe) */
function renderMarkdown(src: string) {
  let s = escapeHtml(src ?? '').replace(/\r\n?/g, '\n')

  // ```lang\n...\n``` fenced
  s = s.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang = '', code = '') => {
    const c = escapeHtml(code)
    const l = String(lang).toLowerCase().trim()
    return `
      <div class="relative group border rounded-lg overflow-hidden">
        <button type="button"
          class="absolute right-2 top-2 text-xs px-2 py-1 rounded-md border bg-background/80 opacity-0 group-hover:opacity-100 transition"
          data-copy="block">Copy</button>
        <pre class="overflow-x-auto text-sm leading-6 p-3 m-0"><code class="language-${l}">${c}</code></pre>
      </div>`
  })

  // inline code
  s = s.replace(/`([^`\n]+)`/g, (_m, code) => `<code class="rounded px-1 py-0.5 border text-[0.9em]">${code}</code>`)

  // headings
  s = s.replace(/^(#{1,6})\s+(.+)$/gm, (_m, hashes: string, text: string) => {
    const level = Math.min(6, hashes.length)
    return `<h${level} class="font-semibold mt-3 mb-2">${text}</h${level}>`
  })

  // bold / italic
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^\*])\*([^\*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')

  // links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) =>
    `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" class="underline decoration-dotted underline-offset-2">${escapeHtml(text)}</a>`
  )

  // lists (light)
  s = s.replace(/(?:^|\n)([-*])\s+([^\n]+)(?=(\n[-*]\s+)|\n\n|$)/g, (_m, _b, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, (m) => `<ul class="list-disc pl-5 space-y-1">${m}</ul>`)
  s = s.replace(/(?:^|\n)(\d+)\.\s+([^\n]+)(?=(\n\d+\.\s+)|\n\n|$)/g, (_m, _n, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, (m) => (m.includes('<ul') ? m : `<ol class="list-decimal pl-5 space-y-1">${m}</ol>`))

  // paragraphs
  s = s.split(/\n{2,}/).map(block => {
    if (/^\s*<(h\d|ul|ol|div|pre)/i.test(block)) return block
    return `<p class="leading-7">${block.replace(/\n/g, '<br>')}</p>`
  }).join('\n')

  return s
}

/* ---------- Generative UI parsing ---------- */
/** Split content into segments: markdown HTML or UI schemas parsed from ```ui fences */
type Segment =
  | { type: 'html'; html: string }
  | { type: 'ui'; schema: any }

function parseSegments(raw: string): Segment[] {
  const out: Segment[] = []
  const re = /```ui\s*([\s\S]*?)```/g
  let last = 0, m: RegExpExecArray | null

  while ((m = re.exec(raw)) !== null) {
    const before = raw.slice(last, m.index)
    if (before.trim()) out.push({ type: 'html', html: renderMarkdown(before) })

    const jsonText = m[1].trim()
    try {
      const schema = JSON.parse(jsonText)
      out.push({ type: 'ui', schema })
    } catch {
      // fallback: show as code
      out.push({ type: 'html', html: renderMarkdown('```json\n' + jsonText + '\n```') })
    }
    last = re.lastIndex
  }
  const rest = raw.slice(last)
  if (rest.trim()) out.push({ type: 'html', html: renderMarkdown(rest) })
  return out
}

const segments = computed(() =>
  props.role === 'assistant' ? parseSegments(props.content || '') : [{ type: 'html', html: renderMarkdown(props.content || '') }]
)

/* Copy helpers */
async function copyWhole() {
  try { await navigator.clipboard.writeText(props.content || '') } catch {}
}
function wireCopyButtons() {
  const el = rootEl.value
  if (!el) return
  el.querySelectorAll<HTMLButtonElement>('button[data-copy="block"]').forEach(btn => {
    btn.onclick = async () => {
      const pre = btn.parentElement?.querySelector('pre')
      const text = pre?.innerText || ''
      try {
        await navigator.clipboard.writeText(text)
        btn.textContent = 'Copied'
        setTimeout(() => (btn.textContent = 'Copy'), 1200)
      } catch {}
    }
  })
}
onMounted(wireCopyButtons)
onUpdated(wireCopyButtons)

/* ---------- simple render helpers for common schemas ---------- */
const has = (obj: any, k: string) => Object.prototype.hasOwnProperty.call(obj ?? {}, k)
</script>

<template>
  <div class="flex items-start gap-2 text-sm">
    <span class="mt-1 shrink-0">
      <Icon v-if="role==='assistant'" name="lucide:bot" class="h-5 w-5 opacity-80" />
      <Icon v-else-if="role==='user'" name="lucide:user" class="h-5 w-5 opacity-80" />
      <Icon v-else name="lucide:info" class="h-5 w-5 opacity-80" />
    </span>

    <div
      :class="role==='user' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
      class="relative rounded-2xl px-3 py-2 w-full"
      ref="rootEl"
    >
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

      <!-- USER: plain -->
      <div v-if="role==='user'" class="whitespace-pre-wrap leading-7">{{ content }}</div>

      <!-- ASSISTANT/SYSTEM: segmented rendering -->
      <template v-else>
        <template v-for="(seg, i) in segments" :key="i">
          <!-- Markdown blocks -->
          <div v-if="seg.type==='html'" class="prose prose-sm max-w-none dark:prose-invert" v-html="seg.html" />

          <!-- Generative UI blocks -->
          <div v-else-if="seg.type==='ui'">
            <!-- Cards -->
            <div
              v-if="seg.schema?.type === 'cards' && Array.isArray(seg.schema?.cards)"
              class="grid gap-3 sm:grid-cols-2"
            >
              <a
                v-for="(c, idx) in seg.schema.cards"
                :key="idx"
                :href="c.href ? safeUrl(c.href) : undefined"
                :target="c.href ? '_blank' : undefined"
                rel="noopener"
                class="block rounded-xl border bg-background/70 hover:bg-background/90 transition p-3 shadow-sm"
              >
                <div class="flex items-start gap-3">
                  <Icon
                    v-if="c.icon"
                    :name="String(c.icon)"
                    class="h-5 w-5 opacity-80 mt-0.5 shrink-0"
                  />
                  <div>
                    <div class="font-medium">{{ c.title || 'Untitled' }}</div>
                    <div class="text-sm opacity-80 mt-0.5" v-if="c.description">{{ c.description }}</div>
                  </div>
                </div>
                <div v-if="Array.isArray(c.tags) && c.tags.length" class="mt-2 flex flex-wrap gap-1">
                  <span v-for="(t, ti) in c.tags" :key="ti" class="text-[11px] px-1.5 py-0.5 rounded bg-muted/70 border">
                    {{ t }}
                  </span>
                </div>
              </a>
            </div>

            <!-- Steps -->
            <ol
              v-else-if="seg.schema?.type === 'steps' && Array.isArray(seg.schema?.steps)"
              class="list-decimal pl-5 space-y-2"
            >
              <li v-for="(s, si) in seg.schema.steps" :key="si">
                <div class="font-medium" v-if="has(s,'title')">{{ s.title }}</div>
                <div class="text-sm opacity-90" v-if="has(s,'description')">{{ s.description }}</div>
                <a
                  v-if="s.href"
                  :href="safeUrl(s.href)"
                  target="_blank"
                  rel="noopener"
                  class="text-sm underline underline-offset-2"
                >Learn more</a>
              </li>
            </ol>

            <!-- Fallback: show JSON prettified -->
            <pre v-else class="overflow-x-auto text-xs leading-6 p-3 border rounded-md bg-background/60">
{{ JSON.stringify(seg.schema, null, 2) }}
            </pre>
          </div>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.prose :where(pre) {
  background: transparent; /* we already wrap code blocks in a bordered container */
}
</style>







