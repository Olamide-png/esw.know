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
  } catch {
    return '#'
  }
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
        <button type="button" class="absolute right-2 top-2 text-xs px-2 py-1 rounded-md border bg-background/80 opacity-0 group-hover:opacity-100 transition"
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

  // 5) Bold **text** and italic *text* / _text_
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/(^|[^\*])\*([^\*\n]+)\*/g, '$1<em>$2</em>')
  s = s.replace(/(^|[^_])_([^_\n]+)_/g, '$1<em>$2</em>')

  // 6) Links [text](url)
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, text, url) => {
    const u = safeUrl(url)
    const t = escapeHtml(text)
    return `<a href="${u}" target="_blank" rel="noopener noreferrer" class="underline decoration-dotted underline-offset-2">${t}</a>`
  })

  // 7) Lists (very light)
  // unordered
  s = s.replace(/(?:^|\n)([-*])\s+([^\n]+)(?=(\n[-*]\s+)|\n\n|$)/g, (_m, _b, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, (m) => `<ul class="list-disc pl-5 space-y-1">${m}</ul>`)
  // ordered
  s = s.replace(/(?:^|\n)(\d+)\.\s+([^\n]+)(?=(\n\d+\.\s+)|\n\n|$)/g, (_m, _n, item) => `\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, (m) => {
    // If not already wrapped by <ul>, wrap as <ol>. A bit naive, but ok for chat
    if (m.includes('<ul')) return m
    return `<ol class="list-decimal pl-5 space-y-1">${m}</ol>`
  })

  // 8) Paragraphs: split double newlines
  s = s
    .split(/\n{2,}/)
    .map(block => {
      // keep block-level tags unwrapped
      if (/^\s*<(h\d|ul|ol|div|pre)/i.test(block)) return block
      const withBr = block.replace(/\n/g, '<br>')
      return `<p class="leading-7">${withBr}</p>`
    })
    .join('\n')

  return s
}

const html = computed(() => renderMarkdown(props.content ?? ''))

async function copyWhole() {
  try {
    await navigator.clipboard.writeText(props.content || '')
  } catch {}
}

// handle “Copy” buttons inside code blocks
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
    <span class="mt-1">
      <Icon v-if="role==='assistant'" name="lucide:bot" class="h-5 w-5 opacity-80" />
      <Icon v-else-if="role==='user'" name="lucide:user" class="h-5 w-5 opacity-80" />
      <Icon v-else name="lucide:info" class="h-5 w-5 opacity-80" />
    </span>

    <div
      :class="role==='user' ? 'bg-primary text-primary-foreground' : 'bg-muted'"
      class="relative rounded-2xl px-3 py-2 whitespace-pre-wrap w-full"
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

      <!-- Render Markdown -->
      <div v-if="role!=='user'" class="prose prose-sm max-w-none dark:prose-invert" v-html="html" />
      <div v-else>{{ content }}</div>
    </div>
  </div>
</template>

<style scoped>
.prose :where(pre) {
  background: transparent; /* we already wrap with a bordered container */
}
</style>



