<!-- components/ApiEndpointTryIt.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'

type HttpMethod = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'
type Dict = Record<string, any>

const props = withDefaults(defineProps<{
  method: HttpMethod
  path: string
  baseUrl?: string
  title?: string
  defaults?: {
    path?: Dict
    query?: Dict
    headers?: Dict
    body?: any
    auth?: { type?: 'none'|'bearer'|'basic', token?: string, username?: string, password?: string }
  }
  baseUrls?: string[]
  allowMethodSwitch?: boolean
}>(), {
  baseUrl: '',
  title: '',
  defaults: () => ({}),
  baseUrls: () => [],
  allowMethodSwitch: false
})

const open = ref(false)
const reqTab = ref<'path'|'query'|'headers'|'auth'>('path')
const respTab = ref<'body'|'headers'>('body')

const method = ref<HttpMethod>(props.method)
const envBaseUrl = ref(props.baseUrl || (props.baseUrls[0] || ''))
const livePath = ref(props.path)
const pathParams = ref<Dict>({ ...(props.defaults?.path || {}) })
const queryParams = ref<Dict>({ ...(props.defaults?.query || {}) })
const headers = ref<Dict>({ 'Content-Type': 'application/json', ...(props.defaults?.headers || {}) })
const auth = ref<{type:'none'|'bearer'|'basic', token?:string, username?:string, password?:string}>({
  type: props.defaults?.auth?.type || 'none',
  token: props.defaults?.auth?.token,
  username: props.defaults?.auth?.username,
  password: props.defaults?.auth?.password
})
const bodyRaw = ref(typeof props.defaults?.body === 'undefined' ? '' : tryStringify(props.defaults?.body))

const sending = ref(false)
const responseStatus = ref<number|null>(null)
const responseTimeMs = ref<number|null>(null)
const responseHeaders = ref<Dict>({})
const responseText = ref<string>('')

/* ───────────── Helpers ───────────── */
function tryStringify(v:any){ try{ return JSON.stringify(v,null,2) }catch{ return String(v) } }
function isJsonContent(){
  const ct = String(headers.value['Content-Type'] || headers.value['content-type'] || '').toLowerCase()
  return ct.includes('application/json')
}
function parsedBody(): any {
  if (!bodyRaw.value?.trim()) return undefined
  if (isJsonContent()) { try { return JSON.parse(bodyRaw.value) } catch {} }
  return bodyRaw.value
}
function buildUrl(): string {
  let p = livePath.value.replace(/\{(\w+)\}/g, (_, k) => {
    const v = pathParams.value?.[k]
    return encodeURIComponent(v ?? `{${k}}`)
  })
  const entries = Object.entries(queryParams.value || {}).filter(([,v]) => v !== '' && v !== null && typeof v !== 'undefined')
  const qs = new URLSearchParams(entries as any).toString()
  const base = envBaseUrl.value?.trim() ? envBaseUrl.value.replace(/\/+$/,'') : ''
  return base + p + (qs ? `?${qs}` : '')
}
function sh(s:string){ const q=`'`; return q + String(s).replace(/'/g, `'\\''`) + q }

/* cURL must be defined BEFORE any watcher uses it */
const curl = computed(() => {
  const h = Object.entries(headers.value || {}).filter(([,v]) => String(v).length).map(([k,v]) => `-H ${sh(`${k}: ${v}`)}`)
  const body = parsedBody()
  const bodyPart = (method.value==='GET'||method.value==='DELETE') ? '' :
    (typeof body==='undefined' ? '' : ` \\\n  --data ${sh(isJsonContent()?JSON.stringify(body):String(body))}`)
  const authPart =
    auth.value.type==='bearer' && auth.value.token ? ` \\\n  -H ${sh('Authorization: Bearer ' + auth.value.token)}`
    : auth.value.type==='basic' && auth.value.username ? ` \\\n  -u ${sh(`${auth.value.username}:${auth.value.password || ''}`)}`
    : ''
  return ['curl','-X',method.value, ...h, authPart.trim(), sh(buildUrl())].filter(Boolean).join(' ') + bodyPart
})

const methodColor = computed(() => ({
  GET: 'bg-emerald-600 text-white',
  POST: 'bg-blue-600 text-white',
  PUT: 'bg-amber-600 text-white',
  PATCH: 'bg-violet-600 text-white',
  DELETE: 'bg-rose-600 text-white'
}[method.value] || 'bg-gray-600 text-white'))

const pathSegments = computed(() => {
  const segs: Array<{text:string,isParam:boolean}> = []
  livePath.value.split('/').filter(Boolean).forEach(seg=>{
    const m = seg.match(/^\{(\w+)\}$/)
    if (m) segs.push({text:m[1],isParam:true})
    else segs.push({text:seg,isParam:false})
  })
  return segs
})

function renameKv(target:'query'|'headers', oldKey:string, newKey:string){
  if (!newKey || newKey === oldKey) return
  const src = target === 'query' ? { ...queryParams.value } : { ...headers.value }
  if (!Object.prototype.hasOwnProperty.call(src, oldKey)) return
  const val = (src as any)[oldKey]; delete (src as any)[oldKey]
  let key = newKey, i = 1
  while (Object.prototype.hasOwnProperty.call(src, key)) key = `${newKey}_${i++}`
  ;(src as any)[key] = val
  if (target==='query') queryParams.value = src
  else headers.value = src
}

/* ───────────── Request action ───────────── */
async function sendRequest() {
  sending.value = true
  responseStatus.value = null
  responseTimeMs.value = null
  responseHeaders.value = {}
  responseText.value = ''

  const url = buildUrl()
  const init: RequestInit = { method: method.value, headers: { ...headers.value } }

  if (auth.value.type==='bearer' && auth.value.token) (init.headers as any)['Authorization'] = `Bearer ${auth.value.token}`
  else if (auth.value.type==='basic' && auth.value.username) {
    (init.headers as any)['Authorization'] = `Basic ${btoa(`${auth.value.username}:${auth.value.password || ''}`)}`
  }

  if (!['GET','DELETE'].includes(method.value)) {
    const body = parsedBody()
    if (typeof body !== 'undefined') init.body = isJsonContent() && typeof body !== 'string' ? JSON.stringify(body) : (body as any)
  }

  const t0 = performance.now()
  try {
    const res = await fetch(url, init)
    const t1 = performance.now()
    responseStatus.value = res.status
    responseTimeMs.value = Math.round(t1 - t0)
    const hh: Dict = {}; res.headers.forEach((v,k)=>{ hh[k]=v }); responseHeaders.value = hh
    const txt = await res.text()
    try { responseText.value = JSON.stringify(JSON.parse(txt), null, 2) } catch { responseText.value = txt }
    respTab.value = 'body'
  } catch (e:any) {
    const t1 = performance.now()
    responseStatus.value = -1
    responseTimeMs.value = Math.round(t1 - t0)
    responseText.value = `Request failed: ${e?.message || e}`
    respTab.value = 'body'
  } finally {
    sending.value = false
    renderHighlights()
  }
}

/* ───────────── Shiki (after 'curl' exists) ───────────── */
let _shikiHighlighter: any | null = null
let _shikiReady: Promise<any> | null = null
async function getHighlighterSingleton() {
  if (_shikiHighlighter) return _shikiHighlighter
  if (_shikiReady) return _shikiReady
  _shikiReady = (async () => {
    const { getHighlighter } = await import('shiki')
    const githubDark = (await import('shiki/themes/github-dark-default.mjs')).default
    const githubLight = (await import('shiki/themes/github-light-default.mjs')).default
    const bash = (await import('shiki/langs/bash.mjs')).default
    const json = (await import('shiki/langs/json.mjs')).default
    const highlighter = await getHighlighter({ themes: [githubDark, githubLight], langs: [bash, json] })
    _shikiHighlighter = highlighter
    return highlighter
  })()
  return _shikiReady
}
function currentTheme() {
  if (typeof window === 'undefined') return 'github-dark-default' // SSR-safe
  return window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'github-light-default'
    : 'github-dark-default'
}
const curlHtml = ref<string>('')            // bash
const responseBodyHtml = ref<string>('')    // json
const responseHeadersHtml = ref<string>('') // json

async function renderHighlights() {
  // Client only
  if (typeof window === 'undefined') return
  const h = await getHighlighterSingleton()
  const theme = currentTheme()
  curlHtml.value = h.codeToHtml(String(curl.value), { lang: 'bash', theme })
  let body = responseText.value ?? ''
  try { body = JSON.stringify(JSON.parse(body), null, 2) } catch {}
  responseBodyHtml.value = h.codeToHtml(body, { lang: 'json', theme })
  responseHeadersHtml.value = h.codeToHtml(tryStringify(responseHeaders.value) || '', { lang: 'json', theme })
}

/* Watchers AFTER 'curl' is declared */
onMounted(renderHighlights)
watch(open, async (val) => { if (val) { await nextTick(); renderHighlights() } })
watch(curl, async () => { await nextTick(); renderHighlights() }, { flush: 'post' })
watch([responseText, () => JSON.stringify(responseHeaders.value)], async () => {
  await nextTick(); renderHighlights()
}, { flush: 'post' })

/* K/V helpers */
function addKv(target:'path'|'query'|'headers') {
  const obj = target==='path' ? pathParams.value : target==='query' ? queryParams.value : headers.value
  const copy = { ...obj }; let i = 1; while ((copy as any)[`key${i}`] !== undefined) i++; (copy as any)[`key${i}`] = ''
  if (target==='path') pathParams.value = copy; else if (target==='query') queryParams.value = copy; else headers.value = copy
}
function removeKv(target:'path'|'query'|'headers', k:string) {
  const obj = target==='path' ? pathParams.value : target==='query' ? queryParams.value : headers.value
  const copy: Dict = {}; Object.keys(obj).forEach(key => { if (key !== k) (copy as any)[key] = (obj as any)[key] })
  if (target==='path') pathParams.value = copy; else if (target==='query') queryParams.value = copy; else headers.value = copy
}
function copyToClipboard(text:string){ navigator.clipboard?.writeText(text).catch(()=>{}) }
</script>

<template>
  <!-- …template unchanged except for fallbacks already in place… -->
  <!-- In cURL and Response sections, keep the v-if html / v-else pre fallback you have. -->
</template>

<style scoped>
:where(.font-mono){ font-variant-ligatures: none; }
:root { --primary: #3b82f6; --primary-foreground: #fff; }
.bg-primary{ background: var(--primary); }
.text-primary-foreground{ color: var(--primary-foreground); }
:deep(.shiki){ padding:.5rem .75rem; border-radius:.5rem; background:transparent }
:deep(.shiki code){ font-variant-ligatures:none; font-size:.75rem }
</style>






