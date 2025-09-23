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
/* 🔹 Split tabs: request editor + response viewer */
const reqTab = ref<'path'|'query'|'headers'|'auth'>('path')
const respTab = ref<'body'|'headers'>('body')  // ✅ Body shown by default

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

/** ───────────────────────── Shiki setup (inline singleton) ───────────────────────── */
let _shikiHighlighter: any | null = null
let _shikiReady: Promise<any> | null = null
async function getHighlighterSingleton() {
  if (_shikiHighlighter) return _shikiHighlighter
  if (_shikiReady) return _shikiReady
  _shikiReady = (async () => {
    const { getHighlighter } = await import('shiki')
    // Explicit imports so Vite bundles assets
    const githubDark = (await import('shiki/themes/github-dark-default.mjs')).default
    const githubLight = (await import('shiki/themes/github-light-default.mjs')).default
    const bash = (await import('shiki/langs/bash.mjs')).default
    const json = (await import('shiki/langs/json.mjs')).default
    const highlighter = await getHighlighter({
      themes: [githubDark, githubLight],
      langs: [bash, json],
    })
    _shikiHighlighter = highlighter
    return highlighter
  })()
  return _shikiReady
}

function currentTheme() {
  // If you have app-level dark mode state, read that instead.
  return window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'github-light-default'
    : 'github-dark-default'
}

// Highlighted HTML containers (Shiki outputs full <pre class="shiki">…</pre>)
const curlHtml = ref<string>('')            // bash
const responseBodyHtml = ref<string>('')    // json
const responseHeadersHtml = ref<string>('') // json

async function renderHighlights() {
  const h = await getHighlighterSingleton()
  const theme = currentTheme()

  curlHtml.value = h.codeToHtml(String(curl.value), { lang: 'bash', theme })

  // Pretty-print JSON if possible before highlighting
  let body = responseText.value ?? ''
  try { body = JSON.stringify(JSON.parse(body), null, 2) } catch {}
  responseBodyHtml.value = h.codeToHtml(body, { lang: 'json', theme })

  responseHeadersHtml.value = h.codeToHtml(tryStringify(responseHeaders.value) || '', { lang: 'json', theme })
}

// Re-render on mount, when opening modal, and when content changes
onMounted(renderHighlights)

watch(open, async (val) => {
  if (val) {
    await nextTick()
    renderHighlights()
  }
})

watch(curl, async () => {
  await nextTick()
  renderHighlights()
}, { flush: 'post' })

watch([responseText, () => JSON.stringify(responseHeaders.value)], async () => {
  await nextTick()
  renderHighlights()
}, { flush: 'post' })

/** ───────────────────────── Helpers ───────────────────────── */
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
    // refresh highlights after new content arrives
    renderHighlights()
  }
}

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
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div v-if="allowMethodSwitch">
                <label class="mb-1 block text-xs opacity-80">Method</label>
                <select v-model="method" class="w-full rounded-md bg-neutral-900 border border-white/10 px-2 py-2">
                  <option>GET</option><option>POST</option><option>PUT</option><option>PATCH</option><option>DELETE</option>
                </select>
              </div>
              <div :class="allowMethodSwitch ? 'md:col-span-2' : 'md:col-span-3'">
                <label class="mb-1 block text-xs opacity-80">Base URL</label>
                <div class="flex gap-2">
                  <input v-model="envBaseUrl" placeholder="https://api.example.com"
                         class="w-full rounded-md bg-neutral-900 border border-white/10 px-3 py-2 font-mono" />
                  <select v-if="baseUrls.length" v-model="envBaseUrl"
                          class="w-40 rounded-md bg-neutral-900 border border-white/10 px-2 py-2">
                    <option v-for="url in baseUrls" :key="url" :value="url">{{ url }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label class="mb-1 block text-xs opacity-80">Path</label>
              <input v-model="livePath" class="w-full rounded-md bg-neutral-900 border border-white/10 px-3 py-2 font-mono" />
            </div>

            <!-- Tabs -->
            <div>
              <div class="grid grid-cols-4 overflow-hidden rounded-md border border-white/10">
                <button :class="['px-3 py-2 text-sm', reqTab==='path' ? 'bg-white/10' : 'bg-transparent']" @click="reqTab='path'">Path Params</button>
                <button :class="['px-3 py-2 text-sm', reqTab==='query' ? 'bg-white/10' : 'bg-transparent']" @click="reqTab='query'">Query</button>
                <button :class="['px-3 py-2 text-sm', reqTab==='headers' ? 'bg-white/10' : 'bg-transparent']" @click="reqTab='headers'">Headers</button>
                <button :class="['px-3 py-2 text-sm', reqTab==='auth' ? 'bg-white/10' : 'bg-transparent']" @click="reqTab='auth'">Auth</button>
              </div>

              <!-- PATH -->
              <div v-show="reqTab==='path'" class="mt-3 space-y-2">
                <div v-for="(v,k) in pathParams" :key="k" class="grid grid-cols-5 gap-2">
                  <input :value="k" disabled class="col-span-2 rounded-md bg-neutral-900 border border-white/10 px-3 py-2 font-mono opacity-70" />
                  <input v-model="pathParams[k]" class="col-span-3 rounded-md bg-neutral-900 border border-white/10 px-3 py-2 font-mono" />
                  <div class="col-span-5">
                    <button class="text-xs rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                            @click="removeKv('path', k)">Remove</button>
                  </div>
                </div>
                <button class="mt-1 text-xs rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                        @click="addKv('path')">Add</button>
              </div>

              <!-- QUERY -->
              <div v-show="reqTab==='query'" class="mt-3 space-y-2">
                <div v-for="(v,k) in queryParams" :key="k" class="grid grid-cols-5 gap-2">
                  <input :value="k" class="col-span-2 rounded-md bg-neutral-900 border border-white/10 px-3 py-2 font-mono"
                         placeholder="key"
                         @input="renameKv('query', k, ($event.target as HTMLInputElement).value)" />
                  <input v-model="queryParams[k]" class="col-span-3 rounded-md bg-neutral-900 border border-white/10 px-3 py-2 font-mono" placeholder="value" />
                  <div class="col-span-5">
                    <button class="text-xs rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                            @click="removeKv('query', k)">Remove</button>
                  </div>
                </div>
                <button class="mt-1 text-xs rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                        @click="addKv('query')">Add</button>
              </div>

              <!-- HEADERS -->
              <div v-show="reqTab==='headers'" class="mt-3 space-y-2">
                <div v-for="(v,k) in headers" :key="k" class="grid grid-cols-5 gap-2">
                  <input :value="k" class="col-span-2 rounded-md bg-neutral-900 border border-white/10 px-3 py-2 font-mono"
                         placeholder="Header"
                         @input="renameKv('headers', k, ($event.target as HTMLInputElement).value)" />
                  <input v-model="headers[k]" class="col-span-3 rounded-md bg-neutral-900 border border-white/10 px-3 py-2 font-mono" placeholder="Value" />
                  <div class="col-span-5">
                    <button class="text-xs rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                            @click="removeKv('headers', k)">Remove</button>
                  </div>
                </div>
                <button class="mt-1 text-xs rounded-md border border-white/10 px-2 py-1 hover:bg-white/5"
                        @click="addKv('headers')">Add</button>
              </div>

              <!-- AUTH -->
              <div v-show="reqTab==='auth'" class="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label class="mb-1 block text-xs opacity-80">Type</label>
                  <select v-model="auth.type" class="w-full rounded-md bg-neutral-900 border border-white/10 px-2 py-2">
                    <option value="none">None</option>
                    <option value="bearer">Bearer</option>
                    <option value="basic">Basic</option>
                  </select>
                </div>
                <div v-if="auth.type==='bearer'" class="md:col-span-2">
                  <label class="mb-1 block text-xs opacity-80">Token</label>
                  <input v-model="auth.token" placeholder="eyJhbGciOi..." class="w-full rounded-md bg-neutral-900 border border-white/10 px-3 py-2" />
                </div>
                <template v-if="auth.type==='basic'">
                  <div>
                    <label class="mb-1 block text-xs opacity-80">Username</label>
                    <input v-model="auth.username" class="w-full rounded-md bg-neutral-900 border border-white/10 px-3 py-2" />
                  </div>
                  <div>
                    <label class="mb-1 block text-xs opacity-80">Password</label>
                    <input type="password" v-model="auth.password" class="w-full rounded-md bg-neutral-900 border border-white/10 px-3 py-2" />
                  </div>
                </template>
              </div>
            </div>

            <!-- Body -->
            <div v-if="!['GET','DELETE'].includes(method)" class="space-y-1">
              <label class="mb-1 block text-xs opacity-80">Body</label>
              <textarea v-model="bodyRaw" rows="8" class="w-full rounded-md bg-neutral-900 border border-white/10 px-3 py-2 font-mono" placeholder="{}"></textarea>
              <p class="text-xs text-neutral-400">TIP: Body is parsed as JSON when <code>Content-Type: application/json</code>.</p>
            </div>

            <div class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono">
              <div class="flex items-center justify-between gap-2">
                <span class="opacity-80">Request URL</span>
                <button class="px-2 py-1 rounded hover:bg-white/10" @click="copyToClipboard(buildUrl())">Copy</button>
              </div>
              <div class="mt-1 overflow-hidden text-ellipsis whitespace-nowrap">{{ buildUrl() }}</div>
            </div>

            <!-- cURL (Shiki + fallback) -->
            <div class="rounded-lg border border-white/10 bg-white/5">
              <div class="flex items-center justify-between p-2">
                <span class="text-xs opacity-80">cURL</span>
                <button class="px-2 py-1 rounded hover:bg-white/10" @click="copyToClipboard(curl)">Copy</button>
              </div>
              <div class="h-36 overflow-auto">
                <div v-if="curlHtml" v-html="curlHtml"></div>
                <pre v-else class="px-3 pb-3 text-xs font-mono whitespace-pre-wrap">{{ curl }}</pre>
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

            <!-- Response Body (Shiki + fallback) -->
            <div v-show="respTab==='body'" class="h-[420px] overflow-auto">
              <div v-if="responseBodyHtml" v-html="responseBodyHtml"></div>
              <pre v-else class="px-3 py-2 text-xs font-mono whitespace-pre-wrap">{{ responseText }}</pre>
            </div>
            <!-- Response Headers (Shiki + fallback) -->
            <div v-show="respTab==='headers'" class="h-[420px] overflow-auto">
              <div v-if="responseHeadersHtml" v-html="responseHeadersHtml"></div>
              <pre v-else class="px-3 py-2 text-xs font-mono whitespace-pre-wrap">{{ tryStringify(responseHeaders) }}</pre>
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
/* quick primary tokens (inherit from your theme if present) */
:root { --primary: #3b82f6; --primary-foreground: #fff; }
.bg-primary{ background: var(--primary); }
.text-primary-foreground{ color: var(--primary-foreground); }

/* Optional: tighten Shiki blocks a bit */
:deep(.shiki) {
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  background: transparent; /* keep container bg */
}
:deep(.shiki code) {
  font-variant-ligatures: none;
  font-size: 0.75rem;
}
</style>





