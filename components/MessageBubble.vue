<script setup lang="ts">
import { computed, onMounted, onUpdated, ref } from 'vue'
import AiGenerativeUi from '@/components/AiGenerativeUi.vue'

const props = defineProps<{ role:'user'|'assistant'|'system'; content:string }>()
const rootEl = ref<HTMLElement|null>(null)

/* ---------- helpers (same as before, trimmed) ---------- */
function escapeHtml(s:string){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function safeUrl(u:string){ try{const url=new URL(u, typeof window!=='undefined'?location.origin:'https://x'); return ['http:','https:','mailto:'].includes(url.protocol)?url.href:'#'}catch{return'#'} }

/* --- very small, safe markdown renderer --- */
function renderMarkdown(src:string){
  let s = escapeHtml(src ?? '').replace(/\r\n?/g,'\n')

  // blockquote
  s = s.replace(/(^|\n)>\s?([^\n]+)(?=\n|$)/g, (_m,_a,txt)=>`\n<blockquote class="border-l-2 pl-3 my-2 opacity-90">${txt}</blockquote>`)

  // fenced code
  s = s.replace(/```(\w+)?\n([\s\S]*?)```/g, (_m,lang='',code='')=>{
    const c=escapeHtml(code); const l=String(lang).toLowerCase().trim()
    return `<div class="relative group border rounded-lg overflow-hidden">
      <button type="button" class="absolute right-2 top-2 text-xs px-2 py-1 rounded-md border bg-background/80 opacity-0 group-hover:opacity-100 transition" data-copy="block">Copy</button>
      <pre class="overflow-x-auto text-sm leading-6 p-3 m-0"><code class="language-${l}">${c}</code></pre>
    </div>`
  })

  // inline code
  s = s.replace(/`([^`\n]+)`/g, (_m,code)=>`<code class="rounded px-1 py-0.5 border text-[0.9em]">${code}</code>`)

  // headings
  s = s.replace(/^(#{1,6})\s+(.+)$/gm, (_m,hashes:string,text:string)=>`<h${Math.min(6,hashes.length)} class="font-semibold mt-3 mb-2">${text}</h${Math.min(6,hashes.length)}>`)
  // bold/italic
  s = s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/(^|[^\*])\*([^\*\n]+)\*/g,'$1<em>$2</em>')
  // links
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m,text,url)=>`<a href="${safeUrl(url)}" target="_blank" rel="noopener" class="underline decoration-dotted underline-offset-2">${escapeHtml(text)}</a>`)
  // unordered / ordered lists
  s = s.replace(/(?:^|\n)([-*])\s+([^\n]+)(?=(\n[-*]\s+)|\n\n|$)/g, (_m,_b,item)=>`\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, m=>`<ul class="list-disc pl-5 space-y-1">${m}</ul>`)
  s = s.replace(/(?:^|\n)(\d+)\.\s+([^\n]+)(?=(\n\d+\.\s+)|\n\n|$)/g, (_m,_n,item)=>`\n<li>${item}</li>`)
  s = s.replace(/(?:\n<li>[\s\S]*?<\/li>)+/g, m=> m.includes('<ul')?m:`<ol class="list-decimal pl-5 space-y-1">${m}</ol>`)

  // paragraphs
  s = s.split(/\n{2,}/).map(block => /^\s*<(h\d|ul|ol|div|pre|blockquote)/i.test(block) ? block : `<p class="leading-7">${block.replace(/\n/g,'<br>')}</p>`).join('\n')
  return s
}

/* ---------- Generative UI extraction ---------- */
function extractUiJson(raw:string){
  if (!raw) return null
  const m = raw.match(/```ui\s*([\s\S]*?)```/i) || raw.match(/:::ui\s*([\s\S]*?):::/i)
  if (!m) return null
  try { return JSON.parse(m[1]) } catch { return null }
}
const uiSchema = computed(() => extractUiJson(props.content))
const contentWithoutUi = computed(() =>
  (props.content || '').replace(/```ui[\s\S]*?```/i,'').replace(/:::ui[\s\S]*?:::/i,'').trim()
)

const html = computed(() => renderMarkdown(contentWithoutUi.value))

/* copy buttons inside code blocks */
const rootEl = ref<HTMLElement|null>(null)
async function copyWhole(){ try{ await navigator.clipboard.writeText(contentWithoutUi.value || '') }catch{} }
function wireCopyButtons(){
  const el = rootEl.value; if (!el) return
  el.querySelectorAll<HTMLButtonElement>('button[data-copy="block"]').forEach(btn=>{
    btn.onclick = async ()=>{
      const pre = btn.parentElement?.querySelector('pre'); const text = pre?.innerText || ''
      try { await navigator.clipboard.writeText(text); btn.textContent='Copied'; setTimeout(()=>btn.textContent='Copy',1200) } catch {}
    }
  })
}
onMounted(wireCopyButtons); onUpdated(wireCopyButtons)
</script>

<template>
  <div class="flex items-start gap-2 text-sm">
    <span class="mt-1 shrink-0">
      <Icon v-if="role==='assistant'" name="lucide:bot" class="h-5 w-5 opacity-80" />
      <Icon v-else-if="role==='user'" name="lucide:user" class="h-5 w-5 opacity-80" />
      <Icon v-else name="lucide:info" class="h-5 w-5 opacity-80" />
    </span>

    <div
      :class="role==='user' ? 'bg-primary text-primary-foreground' : 'bg-muted/70'"
      class="rounded-2xl px-3 py-2 w-full break-words [overflow-wrap:anywhere] overflow-hidden select-text"
      ref="rootEl"
    >
      <!-- Optional Generative UI -->
      <AiGenerativeUi v-if="role==='assistant' && uiSchema" :schema="uiSchema" class="mb-3" />

      <!-- Markdown -->
      <div v-if="role!=='user'" class="prose prose-sm max-w-none dark:prose-invert" v-html="html" />
      <div v-else class="whitespace-pre-wrap">{{ contentWithoutUi }}</div>

      <!-- Toolbar -->
      <div v-if="role==='assistant' && (contentWithoutUi || uiSchema)" class="mt-2 flex justify-end">
        <button type="button" class="rounded-md border bg-background/80 px-2 py-1 text-xs shadow hover:shadow-md opacity-80 hover:opacity-100" @click="copyWhole">Copy</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose :where(pre){ background: transparent; }
.prose :where(p){ margin:.4rem 0; }
.prose :where(h1,h2,h3,h4,h5,h6){ margin-top:.6rem; margin-bottom:.4rem; }
.prose :where(img){ max-width:100%; height:auto; border-radius:.5rem; }
</style>





