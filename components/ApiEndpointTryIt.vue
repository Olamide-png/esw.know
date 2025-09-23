<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useShikiHighlighter } from '~/composables/useShikiHighlighter'

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

/* ───────── State ───────── */
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

/* ───────── Helpers ───────── */
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
    const v = (pathParams.value as any)?.[k]
    return encodeURIComponent(v ?? `{${k}}`)
  })
  const entries = Object.entries(queryParams.value || {}).filter(([,v]) => v !== '' && v !== null && typeof v !== 'undefined')
  const qs = new URLSearchParams(entries as any).toString()
  const base = envBaseUrl.value?.trim() ? envBaseUrl.value.replace(/\/+$/,'') : ''
  return base + p + (qs ? `?${qs}` : '')
}
function sh(s:string){ const q=`'`; return q + String(s).replace(/'/g, `'\\''`) + q }

/* cURL string (explicit string to avoid template ref weirdness) */
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
const curlStr = computed(() => String(curl.value))

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

/* ───────── Request action ───────── */
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

/* ───────── K/V helpers ───────── */
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
function copyToClipboard(text:string){ if (typeof navigator !== 'undefined') navigator.clipboard?.writeText(text).catch(()=>{}) }

/* ───────── Shiki via composable ───────── */
const { ready: shikiReady, ensure: ensureShiki, highlight } = useShikiHighlighter()
const curlHtml = ref('')            // bash -> HTML
const responseBodyHtml = ref('')    // json -> HTML
const responseHeadersHtml = ref('') // json -> HTML

async function renderHighlights() {
  if (!import.meta.client) return
  await ensureShiki({ langs: ['bash','json'], themes: ['github-dark-default','github-light-default'] })
  // cURL
  curlHtml.value = await highlight(curlStr.value || '# (empty)', 'bash')
  // Body
  let body = responseText.value ?? ''
  try { body = JSON.stringify(JSON.parse(body), null, 2) } catch {}
  responseBodyHtml.value = await highlight(body || '{}', 'json')
  // Headers
  responseHeadersHtml.value = await highlight(tryStringify(responseHeaders.value) || '{}', 'json')
}

/* Load & render when modal opens, and keep updated after */
watch(open, async (v) => {
  if (!v) return
  await nextTick()
  renderHighlights()
})
watch(curlStr, () => renderHighlights(), { flush: 'post', immediate: false })
watch([responseText, () => JSON.stringify(responseHeaders.value)], () => renderHighlights(), { flush: 'post' })
watch(shikiReady, (v) => { if (v) renderHighlights() })
</script>

<template>
  <!-- Endpoint pill -->
  <div class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900/60 px-3 py-2 shadow-sm">
    <div class="flex items-center gap-3">
      <span :class="['px-2 py-1 text-xs font-semibold rounded-md', methodColor]">{{ method }}</span>
      <div class="rounded-lg bg-black/30 px-3 py-1.5 text-sm font-mono text-neutral-200">
        <span class="opacity-80">/</span>
        <template v-for="(seg, i) in pathSegments" :key="i">
          <template v-if="!seg.isParam">
            <span class="mx-0.5">{{ seg.text }}</span>
          </template>
          <template v-else>
            <span class="mx-0.5 rounded-md bg-blue-500/10 px-2 py-0.5 text-blue-300 ring-1 ring-inset ring-blue-500/30">
              { {{ seg.text }} }
            </span>
          </template>
          <span v-if="i < pathSegments.length - 1" class="opacity-60">/</span>
        </template>
      </div>
    </div>
    <button class="rounded-lg bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90"
            @click="open = true">
      Try it ▶
    </button>
  </div>

  <!-- Modal -->
  <div v-if="open" class="fixed inset-0 z-[120]">
    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="open=false" />
    <div class="absolute inset-x-2 sm:inset-x-8 md:inset-x-16 lg:inset-x-24 top-10 bottom-10
                rounded-xl bg-neutral-950 text-neutral-100 border border-white/10 shadow-2xl overflow-hidden">
      <!-- Header -->
      <div class="flex items-center gap-3 border-b border-white/10 px-4 py-3">
        <span :class="['px-2 py-1 text-xs font-semibold rounded-md', methodColor]">{{ method }}</span>
        <div class="font-mono text-sm truncate">{{ livePath }}</div>
        <div class="ml-auto flex items-center gap-2">
          <button class="rounded-md px-2 py-1 text-sm hover:bg-white/5" @click="open=false">Close</button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 h-[calc(100%-48px)]">
        <!-- Left: Request -->
        <div class="rounded-lg border border-white/10 overflow-hidden flex flex-col">
          <div class="border-b border-white/10 px-4 py-2 text-sm font-semibold">Request</div>
          <div class="p-4 space-y-4 overflow-auto">
            <!-- …your inputs / tabs remain unchanged… -->

            <!-- cURL -->
            <div class="rounded-lg border border-white/10 bg-white/5">
              <div class="flex items-center justify-between p-2">
                <span class="text-xs opacity-80">cURL</span>
                <button class="px-2 py-1 rounded hover:bg-white/10" @click="copyToClipboard(curlStr)">Copy</button>
              </div>
              <div class="h-36 overflow-auto">
                <!-- Show plain text immediately; swap to highlighted when ready -->
                <pre v-if="!curlHtml" class="px-3 pb-3 text-xs font-mono whitespace-pre-wrap min-h-[2rem]">
{{ curlStr || '# (empty)' }}
                </pre>
                <div v-else v-html="curlHtml"></div>
              </div>
            </div>
          </div>

          <div class="border-t border-white/10 px-4 py-3 flex justify-end">
            <button class="rounded-md bg-primary text-primary-foreground px-3 py-1.5 hover:opacity-90 disabled:opacity-50"
                    :disabled="sending"
                    @click="sendRequest">
              <span v-if="!sending">Send Request</span>
              <span v-else class="animate-pulse">Sending…</span>
            </button>
          </div>
        </div>

        <!-- Right: Response -->
        <div class="rounded-lg border border-white/10 overflow-hidden flex flex-col">
          <div class="border-b border-white/10 px-4 py-2 text-sm font-semibold">Response</div>
          <div class="p-4 space-y-3 overflow-auto">
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <span v-if="responseStatus !== null"
                    :class="[
                      'px-2 py-1 rounded text-xs font-semibold',
                      responseStatus === -1 ? 'bg-rose-600 text-white'
                      : responseStatus >=200 && responseStatus <300 ? 'bg-emerald-600 text-white'
                      : responseStatus >=400 ? 'bg-rose-600 text-white'
                      : 'bg-amber-600 text-white'
                    ]">
                {{ responseStatus === -1 ? 'Network Error' : `HTTP ${responseStatus}` }}
              </span>
              <span v-if="responseTimeMs !== null" class="text-neutral-400">Time: {{ responseTimeMs }} ms</span>
              <button class="ml-auto px-2 py-1 rounded hover:bg-white/10 text-sm"
                      @click="copyToClipboard(responseText)">Copy Body</button>
            </div>

            <div class="grid grid-cols-2 gap-2">
              <button :class="['px-3 py-2 text-sm rounded-md border border-white/10', respTab==='body' ? 'bg-white/10' : 'bg-transparent']" @click="respTab='body'">Body</button>
              <button :class="['px-3 py-2 text-sm rounded-md border border-white/10', respTab==='headers' ? 'bg-white/10' : 'bg-transparent']" @click="respTab='headers'">Headers</button>
            </div>

            <!-- Response Body -->
            <div v-show="respTab==='body'" class="h-[420px] overflow-auto">
              <pre v-if="!responseBodyHtml" class="px-3 py-2 text-xs font-mono whitespace-pre-wrap min-h-[2rem]">
{{ responseText || '# (no response yet)' }}
              </pre>
              <div v-else v-html="responseBodyHtml"></div>
            </div>
            <!-- Response Headers -->
            <div v-show="respTab==='headers'" class="h-[420px] overflow-auto">
              <pre v-if="!responseHeadersHtml" class="px-3 py-2 text-xs font-mono whitespace-pre-wrap min-h-[2rem]">
{{ tryStringify(responseHeaders) }}
              </pre>
              <div v-else v-html="responseHeadersHtml"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-0 left-0 right-0 border-t border-white/10 px-4 py-2 text-xs text-neutral-400 flex items-center">
        <span>Try-it Console • <kbd class="px-1 rounded bg-white/10">Esc</kbd> to close</span>
        <span class="ml-auto"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
:where(.font-mono){ font-variant-ligatures: none; }
:root { --primary: #3b82f6; --primary-foreground: #fff; }
.bg-primary{ background: var(--primary); }
.text-primary-foreground{ color: var(--primary-foreground); }
:deep(.shiki){ padding:.5rem .75rem; border-radius:.5rem; background:transparent }
:deep(.shiki code){ font-variant-ligatures:none; font-size:.75rem }
</style>










