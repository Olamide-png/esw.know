<template>
  <div :class="wrapper">
    <div :class="bubble">
      <!-- Assistant: render light Markdown safely -->
      <div
        v-if="role === 'assistant'"
        class="text-sm leading-6 break-words"
        v-html="html"
      />
      <!-- User/System: plain text with line breaks -->
      <div v-else class="text-sm leading-6 whitespace-pre-wrap break-words">
        {{ content }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ role: 'system' | 'user' | 'assistant'; content: string }>()

/* --- tiny, safe markdown renderer (no deps) --- */
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderMarkdownSafe(md: string): string {
  if (!md) return ''
  // escape HTML first
  let txt = escapeHtml(md)

  // code blocks ``` ```
  const codeBlocks: string[] = []
  txt = txt.replace(/```([\s\S]*?)```/g, (_m, code) => {
    const idx =
      codeBlocks.push(
        `<pre class="block overflow-x-auto overflow-y-hidden rounded-md bg-black/80 text-white p-3 text-[12px] leading-5"><code>${escapeHtml(
          code
        )}</code></pre>`
      ) - 1
    return `@@CODEBLOCK_${idx}@@`
  })

  // inline code `code`
  txt = txt.replace(
    /`([^`]+)`/g,
    (_m, g1) =>
      `<code class="rounded bg-black/10 px-1 py-0.5 text-[12px]">${escapeHtml(g1)}</code>`
  )

  // headings (# .. ######)
  for (let i = 6; i >= 1; i--) {
    const re = new RegExp(`^${'#'.repeat(i)}\\s+(.+)$`, 'gm')
    const size = ['text-2xl','text-xl','text-lg','text-base','text-sm','text-xs'][i-1]
    txt = txt.replace(
      re,
      (_m, g1) => `<h${i} class="font-semibold ${size} mt-2 mb-1">${g1.trim()}</h${i}>`
    )
  }

  // links [text](http(s)://...)
  txt = txt.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, label, url) =>
      `<a href="${url}" target="_blank" rel="nofollow noopener" class="underline">${label}</a>`
  )

  // bold and italics
  txt = txt.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  txt = txt.replace(/(^|[\s_])\*([^*\n]+)\*(?=[\s_]|$)/g, '$1<em>$2</em>')

  // unordered lists
  txt = txt.replace(/(?:^|\n)([-*+] .+(?:\n[-*+] .+)*)/g, (block) => {
    const items = block.trim().split('\n').map(line => line.replace(/^[-*+]\s+/, '').trim())
    if (items.length < 2) return block
    return `\n<ul class="list-disc pl-5 my-2">${items.map(li => `<li>${li}</li>`).join('')}</ul>`
  })
  // ordered lists
  txt = txt.replace(/(?:^|\n)((?:\d+\. .+(?:\n))+)/g, (block) => {
    const items = block.trim().split('\n').map(line => line.replace(/^\d+\.\s+/, '').trim())
    if (items.length < 2) return block
    return `\n<ol class="list-decimal pl-5 my-2">${items.map(li => `<li>${li}</li>`).join('')}</ol>`
  })

  // paragraphs (split on double newlines)
  txt = txt
    .split(/\n{2,}/)
    .map(part => {
      // skip if already a block element
      if (/^<(h[1-6]|ul|ol|pre|blockquote)/.test(part.trim())) return part
      return `<p class="my-2">${part.replace(/\n/g, '<br/>')}</p>`
    })
    .join('')

  // restore code blocks
  txt = txt.replace(/@@CODEBLOCK_(\d+)@@/g, (_m, i) => codeBlocks[Number(i)] || '')
  return txt
}

const html = computed(() => renderMarkdownSafe(props.content || ''))

/* --- bubble layout --- */
const wrapper = computed(() =>
  props.role === 'user' ? 'flex justify-end' : 'flex justify-start'
)

const bubble = computed(() =>
  props.role === 'user'
    ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-primary text-primary-foreground px-3 py-2 shadow'
    : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-muted px-3 py-2 shadow'
)
</script>

<style scoped>
/* Ensure nested elements don’t create vertical scrollbars */
:deep(pre) { max-width: 100%; }
:deep(code) { word-break: break-word; }
</style>


