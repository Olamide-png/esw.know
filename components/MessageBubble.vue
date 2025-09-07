<!-- components/MessageBubble.vue -->
<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue'

const props = defineProps<{ role: 'user'|'assistant'|'system'; content: string }>()
const rootEl = ref<HTMLElement | null>(null)

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

function renderMarkdown(src: string) {
  // 1) Escape everything first
  let s = escapeHtml(src ?? '').replace(/\r\n?/g, '\n')

  // 2) Fenced code blocks ```lang\n...\n```
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

  // 3) Inline code `code`
  s = s.replace(/`([^`\n]+)`/g, (_m, code) => `<code class="rounded px-1 py-0.5 border text-[0.9em]">${code}</code>`)

  // 4) Headings (# ... at line start)
  s = s.replace(/^(#{1,6})\s+(.+)$/gm, (_m, hashes: string, text: string) => {
    const level = Math.min(6, hashes.length)
    return `<h${level} class="font-semibold mt-3 mb-2">${text}</h${level}>`
  })

  // 5) Bold / italic
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^\*])\*([^\*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')

  // 6) Links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    const u = safeUrl(url)
    const t = escapeHtml(text)
    return `<a href="${u}" target="_blank" rel="noopener noreferrer" class="underline decoration-dotted underline-offset-2">${t}</a>`
  })

  // 7) Lists (light)
  s = s.replace(/(?:^|\n)([-*])\s+([^\n]+)(?=(\n[-*]\s+)|\n\n|$)/g, (_m, _b, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, m => `<ul class="list-disc pl-5 space-y-1">${m}</ul>`)
  s = s.replace(/(?:^|\n)(\d+)\.\s+([^\n]+)(?=(\n\d+\.\s+)|\n\n|$)/g, (_m, _n, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, m => (m.includes('<ul') ? m : `<ol class="list-decimal pl-5 space-y-1">${m}</ol>`))

  // 8) Paragraphs
  s = s
    .split(/\n{2,}/)
    .map(block => (/^\s*<(h\d|ul|ol|div|pre)/i.test(block) ? block : `<p class="leading-7">${block.replace(/\n/g, '<br>')}</p>`))
    .join('\n')

  return s
}

const html = computed(() => renderMarkdown(props.content ?? ''))

async function copyWhole() {
  try { await navigator.clipboard.writeText(props.content || '') } catch {}
}

// wire code-block copy buttons
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
      class="relative rounded-2xl px-3 py-2 w-full break-words [overflow-wrap:anywhere] overflow-hidden select-text"
      ref="rootEl"
    >
      <!-- Toolbar (so buttons don't overlap content) -->
      <div v-if="role==='assistant'" class="mb-1 flex justify-end">
        <button
          type="button"
          class="rounded-md border bg-background/80 px-2 py-1 text-xs shadow hover:shadow-md opacity-80 hover:opacity-100"
          @click="copyWhole"
          title="Copy message"
        >
          Copy
        </button>
      </div>

      <!-- Render Markdown -->
      <div v-if="role!=='user'" class="prose prose-sm max-w-none dark:prose-invert" v-html="html" />
      <div v-else class="whitespace-pre-wrap">{{ content }}</div>
    </div>
  </div>
</template>

<style scoped>
/* Keep code blocks visually consistent inside the bubble */
.prose :where(pre) { background: transparent; }

/* Trim excessive margins inside bubbles */
.prose :where(p) { margin: .4rem 0; }
.prose :where(h1,h2,h3,h4,h5,h6) { margin-top: .6rem; margin-bottom: .4rem; }

/* Avoid giant images breaking layout (if any get through) */
.prose :where(img) { max-width: 100%; height: auto; border-radius: .5rem; }
</style>




