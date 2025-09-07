<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue'

const props = defineProps<{ role: 'user'|'assistant'|'system'; content: string }>()
const rootEl = ref<HTMLElement | null>(null)

/* ---------- helpers ---------- */
function escapeHtml(s: string) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
function safeUrl(u: string) {
  try {
    const url = new URL(u, typeof window !== 'undefined' ? window.location.origin : 'https://example.com')
    return ['http:', 'https:', 'mailto:'].includes(url.protocol) ? url.href : '#'
  } catch { return '#' }
}

/* ---------- parse “Generative UI” blocks ---------- */
type UiBlock =
  | { type: 'cards', cards: Array<{ title: string; description?: string; href?: string }> }
  | { type: 'callout', title?: string; body?: string; variant?: 'info'|'success'|'warning'|'danger' }
  | { type: 'steps', items: string[] }
  | { type: 'kpis', items: Array<{ label: string; value: string }> }
  | { type: 'table', headers: string[], rows: string[][] }

function extractUiAndText(src: string) {
  let ui: UiBlock | null = null
  let text = src ?? ''

  const m = text.match(/```ui\s*([\s\S]*?)```/i) || text.match(/```json\s*([\s\S]*?)```/i)
  if (m && m[1]) {
    try { ui = JSON.parse(m[1]) } catch {}
    text = text.replace(m[0], '').trim()
  }
  return { ui, text }
}

/* ---------- light but rich markdown to HTML ---------- */
function renderMarkdown(src: string) {
  // ALWAYS escape first
  let s = escapeHtml(src).replace(/\r\n?/g, '\n')

  // Horizontal rule
  s = s.replace(/^\s*[-*_]{3,}\s*$/gm, '<hr>')

  // Blockquotes
  s = s.replace(/(^|\n)>\s?([^\n]+(?:\n(?!\n|> ).+)*)/g, (_m, pfx, body) =>
    `${pfx}<blockquote><p>${body.replace(/\n/g, '<br>')}</p></blockquote>`)

  // Fenced code
  s = s.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m, lang = '', code = '') => {
    const c = escapeHtml(code)
    const l = String(lang).toLowerCase().trim()
    return `
      <div class="relative group border rounded-lg overflow-hidden">
        <button type="button" class="absolute right-2 top-2 text-xs px-2 py-1 rounded-md border bg-background/80 opacity-0 group-hover:opacity-100 transition"
                data-copy="block">Copy</button>
        <pre class="overflow-x-auto text-sm leading-6 p-3 m-0"><code class="language-${l}">${c}</code></pre>
      </div>`
  })

  // Tables (GitHub-style)
  s = s.replace(
    /(^|\n)\|(.+?)\|\s*\n\|([ :-|]+)\|\s*\n((?:\|.*\|\s*(?:\n|$))+)/g,
    (_m, pfx, head, _sep, rows) => {
      const headers = head.split('|').map(h => h.trim())
      const trs = rows
        .trim()
        .split('\n')
        .map(r => `<tr>${r.trim().slice(1, -1).split('|').map(c => `<td>${c.trim()}</td>`).join('')}</tr>`)
        .join('')
      return `${pfx}<table><thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${trs}</tbody></table>`
    }
  )

  // Inline code
  s = s.replace(/`([^`\n]+)`/g, (_m, code) => `<code class="rounded px-1 py-0.5 border text-[0.9em]">${code}</code>`)

  // Headings
  s = s.replace(/^(#{1,6})\s+(.+)$/gm, (_m, hashes: string, text: string) => {
    const level = Math.min(6, hashes.length)
    const sizes = ['text-2xl','text-xl','text-lg','text-base','text-sm','text-xs']
    return `<h${level} class="font-semibold ${sizes[level-1]} mt-3 mb-2">${text}</h${level}>`
  })

  // Bold / italic
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^\*])\*([^\*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')

  // Links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) =>
    `<a href="${safeUrl(url)}" target="_blank" rel="noopener noreferrer" class="underline decoration-dotted underline-offset-2">${text}</a>`
  )

  // Task list items
  s = s.replace(/^- \[( |x)\]\s+(.+)$/gmi, (_m, chk, txt) =>
    `<li class="list-none"><label class="inline-flex items-start gap-2"><input type="checkbox" disabled ${chk==='x'?'checked':''} class="mt-1"><span>${txt}</span></label></li>`
  )

  // Unordered/ordered lists (basic)
  s = s.replace(/(?:^|\n)([-*])\s+([^\n]+)(?=(\n[-*]\s+)|\n\n|$)/g, (_m, _b, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, (m) => `<ul class="list-disc pl-5 space-y-1">${m}</ul>`)
  s = s.replace(/(?:^|\n)(\d+)\.\s+([^\n]+)(?=(\n\d+\.\s+)|\n\n|$)/g, (_m, _n, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, (m) => (m.includes('<ul') ? m : `<ol class="list-decimal pl-5 space-y-1">${m}</ol>`))

  // Paragraphs
  s = s
    .split(/\n{2,}/)
    .map(block => (/^\s*<(h\d|ul|ol|div|pre|table|hr|blockquote)/i.test(block) ? block : `<p class="leading-7">${block.replace(/\n/g, '<br>')}</p>`))
    .join('\n')

  return s
}

/* Build final render data */
const parsed = computed(() => {
  const { ui, text } = extractUiAndText(props.content || '')
  return { ui, html: renderMarkdown(text) }
})

/* Copy buttons inside code blocks */
async function copyWhole() {
  try { await navigator.clipboard.writeText(props.content || '') } catch {}
}
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
</script>

<template>
  <div class="flex items-start gap-2 text-sm">
    <span class="mt-1 shrink-0">
      <Icon v-if="role==='assistant'" name="lucide:bot" class="h-5 w-5 opacity-80" />
      <Icon v-else-if="role==='user'" name="lucide:user" class="h-5 w-5 opacity-80" />
      <Icon v-else name="lucide:info" class="h-5 w-5 opacity-80" />
    </span>

    <div
      :class="role==='user' ? 'bg-primary text-primary-foreground' : 'bg-muted/80 backdrop-blur'"
      class="relative rounded-2xl px-3 py-2 w-full"
      ref="rootEl"
    >
      <!-- Copy whole message -->
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

      <!-- Generative UI (when present) -->
      <template v-if="role!=='user' && parsed.ui">
        <!-- Cards -->
        <div v-if="parsed.ui.type==='cards'" class="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
          <a
            v-for="(c, i) in (parsed.ui.cards || [])"
            :key="i"
            :href="c.href || '#'"
            target="_blank"
            rel="noopener"
            class="rounded-lg border p-3 hover:shadow-sm transition bg-background/70"
          >
            <div class="font-medium">{{ c.title }}</div>
            <p v-if="c.description" class="text-xs opacity-80 mt-1">{{ c.description }}</p>
          </a>
        </div>

        <!-- Callout -->
        <div
          v-else-if="parsed.ui.type==='callout'"
          :class="[
            'rounded-lg border p-3 mb-2',
            parsed.ui.variant==='success' && 'border-green-500/40',
            parsed.ui.variant==='warning' && 'border-amber-500/40',
            parsed.ui.variant==='danger' && 'border-red-500/40',
            (!parsed.ui.variant || parsed.ui.variant==='info') && 'border-blue-500/40'
          ]"
        >
          <div v-if="parsed.ui.title" class="font-medium">{{ parsed.ui.title }}</div>
          <div v-if="parsed.ui.body" class="text-sm opacity-90 mt-1">{{ parsed.ui.body }}</div>
        </div>

        <!-- Steps -->
        <ol v-else-if="parsed.ui.type==='steps'" class="mb-2 list-decimal pl-5 space-y-1">
          <li v-for="(s,i) in parsed.ui.items || []" :key="i">{{ s }}</li>
        </ol>

        <!-- KPIs -->
        <div v-else-if="parsed.ui.type==='kpis'" class="grid grid-cols-2 gap-2 mb-2">
          <div v-for="(k,i) in parsed.ui.items || []" :key="i" class="rounded-lg border p-3 bg-background/70">
            <div class="text-xs opacity-70">{{ k.label }}</div>
            <div class="text-lg font-semibold">{{ k.value }}</div>
          </div>
        </div>

        <!-- Table -->
        <div v-else-if="parsed.ui.type==='table'" class="mb-2 overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead>
              <tr>
                <th v-for="(h,i) in parsed.ui.headers" :key="i" class="text-left py-1 px-2 border-b">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r,ri) in parsed.ui.rows" :key="ri">
                <td v-for="(c,ci) in r" :key="ci" class="py-1 px-2 border-b align-top">{{ c }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- Markdown -->
      <div
        v-if="role!=='user'"
        class="prose prose-sm max-w-none dark:prose-invert"
        v-html="parsed.html"
      />
      <div v-else class="whitespace-pre-wrap">{{ content }}</div>
    </div>
  </div>
</template>

<style scoped>
.prose :where(a){ text-underline-offset: 2px; text-decoration-style: dotted; }
.prose :where(pre){ background: transparent; }
.prose :where(table){ width: 100%; border-collapse: collapse; }
.prose :where(th, td){ padding: .25rem .5rem; border-bottom: 1px solid hsl(var(--border)); }
.prose :where(hr){ border: 0; border-top: 1px solid hsl(var(--border)); margin: 0.75rem 0; }
.prose :where(blockquote){
  border-left: 3px solid hsl(var(--border));
  padding-left: .75rem; margin: .5rem 0;
}
</style>








