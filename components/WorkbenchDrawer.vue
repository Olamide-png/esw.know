<!-- components/WorkbenchDrawer.vue -->
<template>
  <!-- Backdrop -->
  <transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-[60] bg-black/40"
      @click="close"
    />
  </transition>

  <!-- Drawer -->
  <transition name="slide-up">
    <div
      v-if="open"
      class="fixed inset-x-0 bottom-0 z-[61] rounded-t-2xl border-t
             border-neutral-200 dark:border-neutral-800
             bg-white dark:bg-neutral-950 shadow-2xl"
      :style="{ height: heightPx }"
      @keydown.esc="close"
    >
      <!-- Drag handle -->
      <div
        class="group absolute -top-4 left-0 right-0 mx-auto h-4 w-24 cursor-ns-resize"
        @pointerdown="startDrag"
      >
        <div class="mx-auto mt-1 h-1.5 w-16 rounded-full bg-neutral-300/80 dark:bg-neutral-700/80 group-active:bg-primary"></div>
      </div>

      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-2 border-b border-neutral-200 dark:border-neutral-800">
        <div class="flex items-center gap-3">
          <span class="text-sm font-semibold">Workbench</span>
          <nav class="flex gap-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 p-1">
            <button
              v-for="tab in tabs"
              :key="tab"
              type="button"
              class="px-3 py-1.5 text-xs rounded-md"
              :class="activeTab === tab
                ? 'bg-white dark:bg-neutral-800 shadow border border-neutral-200 dark:border-neutral-700'
                : 'opacity-70 hover:opacity-100'"
              @click="activeTab = tab"
            >{{ tab }}</button>
          </nav>
          <span v-if="activeTab==='API Explorer'" class="ml-2 text-xs opacity-70">({{ method }} {{ builtPath || currentPathKey }})</span>
        </div>

        <div class="flex items-center gap-2">
          <label class="hidden md:flex items-center gap-2 text-xs">
            <span class="opacity-70">Base URL</span>
            <input
              v-model="baseUrl"
              class="w-[280px] rounded-md border px-2 py-1 text-xs
                     border-neutral-200 dark:border-neutral-800
                     bg-white dark:bg-neutral-900"
              placeholder="https://api.example.com"
            />
          </label>

          <button
            v-if="activeTab==='API Explorer'"
            class="rounded-md border px-2.5 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900
                   border-neutral-200 dark:border-neutral-800"
            @click="showCode = !showCode"
          >{{ showCode ? 'Hide code' : 'Show code' }}</button>

          <button
            class="rounded-md border px-2.5 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900
                   border-neutral-200 dark:border-neutral-800"
            title="Ctrl+`"
            @click="close"
          >Close</button>
        </div>
      </div>

      <!-- Body -->
      <div class="grid h-[calc(100%-44px)] grid-cols-1 gap-0 lg:grid-cols-12">
        <!-- SHELL -->
        <section v-show="activeTab==='Shell'" class="col-span-12 flex flex-col">
          <div class="flex-1 overflow-auto p-4 font-mono text-sm leading-6">
            <div class="text-xs mb-3 opacity-70">
              Type <code>help</code> for commands. Example:
              <code>get /anything?limit=2</code>,
              <code>post /anything {"foo":"bar"}</code>
            </div>

            <div v-for="(line, i) in shellLines" :key="i" class="whitespace-pre-wrap">
              <span v-if="line.kind==='in'">eswcat&gt; </span>{{ line.text }}
            </div>
          </div>

          <div class="border-t border-neutral-200 dark:border-neutral-800 p-3">
            <form @submit.prevent="runShell" class="flex items-center gap-2">
              <input
                v-model="shellInput"
                placeholder="get /anything?foo=bar    |    set base https://httpbin.org"
                class="flex-1 rounded-md border px-3 py-2 text-sm
                       border-neutral-200 dark:border-neutral-800
                       bg-white dark:bg-neutral-900 font-mono"
              />
              <button
                type="submit"
                class="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900
                       border-neutral-200 dark:border-neutral-800"
              >Run</button>
            </form>
          </div>
        </section>

        <!-- API EXPLORER -->
        <section v-show="activeTab==='API Explorer'" class="col-span-12 lg:col-span-12 grid h-full grid-cols-12">
          <!-- Left: Operation picker -->
          <div class="col-span-12 lg:col-span-4 border-r border-neutral-200 dark:border-neutral-800 overflow-auto p-4 space-y-4">
            <!-- EDITABLE Resource / Path -->
            <div class="space-y-1">
              <label class="text-xs opacity-70">Resource / Path</label>
              <input
                v-model="currentPathKey"
                class="w-full rounded-md border px-2 py-1.5 text-sm font-mono
                       border-neutral-200 dark:border-neutral-800
                       bg-white dark:bg-neutral-900"
                placeholder="/customs/items or /anything/123?limit=10"
              />
            </div>

            <!-- Method picker (color coded) -->
            <div class="space-y-1">
              <label class="text-xs opacity-70">Method</label>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="m in availableMethods"
                  :key="m"
                  type="button"
                  class="px-2.5 py-1 text-xs rounded-md border"
                  :class="[
                    method === m
                      ? 'ring-1 ring-primary/40'
                      : 'opacity-80 hover:opacity-100',
                    methodClass(m)
                  ]"
                  @click="method = m"
                >{{ m }}</button>
              </div>
            </div>

            <div class="rounded-md border p-3 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
              <div class="text-sm font-medium mb-2">{{ operation.summary || (method + ' ' + currentPathKey) }}</div>
              <p v-if="operation.description" class="text-xs opacity-80">{{ operation.description }}</p>
            </div>

            <div v-if="showCode" class="rounded-md border p-3 border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
              <div class="text-xs mb-2 opacity-70">cURL</div>
              <pre class="text-xs whitespace-pre-wrap break-words">
curl -X {{ method }} '{{ builtUrl }}'{{ curlHeaders }}{{ curlBody }}
              </pre>
            </div>
          </div>

          <!-- Right: Params + Body + Run -->
          <div class="col-span-12 lg:col-span-8 flex flex-col h-full">
            <div class="flex-none border-b border-neutral-200 dark:border-neutral-800 px-4 pt-3">
              <!-- Sub tabs -->
              <nav class="flex gap-1">
                <button
                  v-for="t in formTabs"
                  :key="t.key"
                  type="button"
                  class="px-2.5 py-1.5 text-xs rounded-md flex items-center gap-1"
                  :class="formTab===t.key
                    ? 'bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800'
                    : 'opacity-75 hover:opacity-100'"
                  @click="formTab = t.key"
                >
                  <Icon :name="t.icon" class="h-3.5 w-3.5" />
                  <span class="hidden sm:inline">{{ t.label }}</span>
                </button>
              </nav>
            </div>

            <div class="flex-1 overflow-auto p-4 space-y-4">
              <!-- SECURITY (previous format: only Authorization helper) -->
              <div v-if="formTab==='security'">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-semibold">Headers</div>
                  <button
                    class="text-xs opacity-70 hover:opacity-100"
                    @click="toggleAuth()"
                  >{{ hasAuth ? 'Remove Authorization' : 'Add Authorization' }}</button>
                </div>

                <div v-if="hasAuth" class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label class="text-xs">
                    <span class="block opacity-70">Authorization</span>
                    <input
                      v-model="authValue"
                      class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm
                             border-neutral-200 dark:border-neutral-800
                             bg-white dark:bg-neutral-900"
                      placeholder="Bearer <token>"
                    />
                  </label>
                </div>

                <p v-else class="mt-2 text-xs opacity-60">Click “Add Authorization” to insert an Authorization header.</p>
              </div>

              <!-- BODY (previous clean format) -->
              <div v-if="formTab==='body' && supportsBody" class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-semibold">Request Body (JSON)</div>
                  <button
                    class="text-xs opacity-70 hover:opacity-100"
                    @click="formatBody"
                  >Format</button>
                </div>
                <textarea
                  v-model="bodyText"
                  rows="10"
                  class="w-full rounded-md border p-3 text-sm font-mono
                         border-neutral-200 dark:border-neutral-800
                         bg-white dark:bg-neutral-900"
                  placeholder='{ "example": true }'
                />
              </div>

              <!-- QUERY -->
              <div v-if="formTab==='query'">
                <div class="text-xs font-semibold mb-2">Query Parameters</div>
                <div class="space-y-1">
                  <div
                    v-for="(row, i) in queryList"
                    :key="'q'+i"
                    class="grid grid-cols-[auto,1fr,1fr,auto] items-center gap-2"
                  >
                    <input type="checkbox" v-model="row.enabled" class="h-4 w-4 accent-primary" />
                    <input v-model="row.key" class="rounded-md border px-2 py-1.5 text-sm
                                   border-neutral-200 dark:border-neutral-800
                                   bg-white dark:bg-neutral-900" placeholder="key" />
                    <input v-model="row.value" class="rounded-md border px-2 py-1.5 text-sm
                                   border-neutral-200 dark:border-neutral-800
                                   bg-white dark:bg-neutral-900" placeholder="value" />
                    <button class="text-rose-500/80 hover:text-rose-500" @click="removeQuery(i)" title="Delete">
                      <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </button>
                  </div>
                  <button class="mt-2 inline-flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
                          @click="addQuery">
                    <Icon name="lucide:plus" class="h-4 w-4" /> Add query
                  </button>
                </div>
              </div>

              <!-- HEADERS (general headers list) -->
              <div v-if="formTab==='headers'">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-semibold">Header Parameters</div>
                  <button
                    class="text-xs opacity-70 hover:opacity-100"
                    @click="toggleAuth()"
                  >{{ hasAuth ? 'Remove Authorization' : 'Add Authorization' }}</button>
                </div>
                <div class="space-y-1 mt-2">
                  <div
                    v-for="(row, i) in headerList"
                    :key="'h'+i"
                    class="grid grid-cols-[auto,1fr,1fr,auto] items-center gap-2"
                  >
                    <input type="checkbox" v-model="row.enabled" class="h-4 w-4 accent-primary" />
                    <input v-model="row.key" class="rounded-md border px-2 py-1.5 text-sm
                                   border-neutral-200 dark:border-neutral-800
                                   bg-white dark:bg-neutral-900" placeholder="Header name" />
                    <input v-model="row.value" class="rounded-md border px-2 py-1.5 text-sm
                                   border-neutral-200 dark:border-neutral-800
                                   bg-white dark:bg-neutral-900" placeholder="Value" />
                    <button class="text-rose-500/80 hover:text-rose-500" @click="removeHeader(i)" title="Delete">
                      <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </button>
                  </div>
                  <button class="mt-2 inline-flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
                          @click="addHeader">
                    <Icon name="lucide:plus" class="h-4 w-4" /> Add header
                  </button>
                </div>
              </div>

              <!-- COOKIES -->
              <div v-if="formTab==='cookies'">
                <div class="text-xs font-semibold mb-2">Cookies</div>
                <div class="space-y-1">
                  <div
                    v-for="(row, i) in cookieList"
                    :key="'c'+i"
                    class="grid grid-cols-[auto,1fr,1fr,auto] items-center gap-2"
                  >
                    <input type="checkbox" v-model="row.enabled" class="h-4 w-4 accent-primary" />
                    <input v-model="row.key" class="rounded-md border px-2 py-1.5 text-sm
                                   border-neutral-200 dark:border-neutral-800
                                   bg-white dark:bg-neutral-900" placeholder="Cookie name" />
                    <input v-model="row.value" class="rounded-md border px-2 py-1.5 text-sm
                                   border-neutral-200 dark:border-neutral-800
                                   bg-white dark:bg-neutral-900" placeholder="Value" />
                    <button class="text-rose-500/80 hover:text-rose-500" @click="removeCookie(i)" title="Delete">
                      <Icon name="lucide:trash-2" class="h-4 w-4" />
                    </button>
                  </div>
                  <button class="mt-2 inline-flex items-center gap-1 text-xs opacity-70 hover:opacity-100"
                          @click="addCookie">
                    <Icon name="lucide:plus" class="h-4 w-4" /> Add cookie
                  </button>
                </div>
              </div>
            </div>

            <div class="border-t border-neutral-200 dark:border-neutral-800 p-3 flex items-center justify-between">
              <div class="text-xs opacity-70 truncate">
                {{ method }} {{ builtUrl }}
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="rounded-md border px-3 py-2 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900
                         border-neutral-200 dark:border-neutral-800"
                  @click="copyCurl"
                >Copy cURL</button>

                <button
                  :disabled="loading"
                  class="rounded-md border px-3 py-2 text-sm
                         border-neutral-200 dark:border-neutral-800
                         bg-primary/10 dark:bg-primary/20 hover:bg-primary/20 disabled:opacity-60"
                  @click="runRequest"
                >
                  <span v-if="!loading">Run request</span>
                  <span v-else>Running…</span>
                </button>
              </div>
            </div>

            <!-- Response -->
            <div v-if="respDisplay" class="border-t border-neutral-200 dark:border-neutral-800 p-4 overflow-auto max-h-[40vh]">
              <div class="mb-2 flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <span class="text-xs opacity-70">Response</span>

                  <div class="flex items-center gap-1">
                    <!-- status -->
                    <span
                      class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs
                             border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
                      :title="'HTTP status ' + (statusCode ?? '')"
                    >
                      <span :class="['h-1.5 w-1.5 rounded-full', statusDotClass]"></span>
                      {{ statusCode }}
                    </span>

                    <!-- duration -->
                    <span
                      class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs
                             border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
                      title="Duration"
                    >
                      ⏱ {{ elapsedMs ?? 0 }} ms
                    </span>

                    <!-- size -->
                    <span
                      class="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs
                             border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900"
                      title="Payload size"
                    >
                      ⬇ {{ prettyBytes(respBytes ?? 0) }}
                    </span>
                  </div>
                </div>

                <button
                  class="rounded-md border px-2.5 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-900
                         border-neutral-200 dark:border-neutral-800"
                  @click="copyResponse"
                >
                  Copy
                </button>
              </div>

              <pre class="text-xs whitespace-pre-wrap break-words">{{ respDisplay }}</pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
/* v-model:open */
const open = defineModel<boolean>('open', { default: false })
const close = () => { open.value = false }

import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'

/** keyboard toggle (Ctrl + `) */
function onKey(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === '`') {
    e.preventDefault()
    open.value = !open.value
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

/** resizable height (SSR-safe) */
const height = ref<number>(560)
onMounted(() => { height.value = Math.min(560, Math.round(window.innerHeight * 0.7)) })
const heightPx = computed(() => `${height.value}px`)
let dragging = false, startY = 0, startH = 0
function startDrag(e: PointerEvent) {
  dragging = true
  startY = e.clientY
  startH = height.value
  ;(e.target as Element).setPointerCapture(e.pointerId)
  window.addEventListener('pointermove', onDrag)
  window.addEventListener('pointerup', stopDrag)
}
function onDrag(e: PointerEvent) {
  if (!dragging) return
  const delta = startY - e.clientY
  height.value = Math.max(240, Math.min(window.innerHeight - 64, startH + delta))
}
function stopDrag() {
  dragging = false
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', stopDrag)
}

/** Tabs */
const tabs = ['Shell', 'API Explorer'] as const
const activeTab = ref<typeof tabs[number]>('Shell')

/** ============== SHELL ============== */
type ShellLine = { kind: 'in' | 'out'; text: string }
const shellLines = ref<ShellLine[]>([
  { kind: 'out', text: 'Welcome to ESW Catalog Shell!' },
  { kind: 'out', text: 'Type "help" to see available commands.' }
])
const shellInput = ref('')
const baseUrl = ref('https://httpbin.org')
function pushIn(t = '') { shellLines.value.push({ kind: 'in', text: t }) }
function pushOut(t = '') { shellLines.value.push({ kind: 'out', text: t }) }
async function runShell() {
  const cmd = shellInput.value.trim()
  if (!cmd) return
  pushIn(cmd)
  shellInput.value = ''

  if (cmd === 'help') {
    pushOut('Commands:')
    pushOut('  set base <url>')
    pushOut('  get|post|put|delete <path> [json body]')
    pushOut('Examples:')
    pushOut('  set base https://api.example.com')
    pushOut('  get /customs/items?limit=5')
    pushOut('  post /customs/items {"sku":"123","hsCode":"9999.99.99"}')
    return
  }
  if (cmd.startsWith('set base ')) {
    baseUrl.value = cmd.slice(9).trim()
    pushOut('Base URL set: ' + baseUrl.value)
    return
  }

  const m = cmd.match(/^(get|post|put|delete)\s+(\S+)(?:\s+([\s\S]+))?$/i)
  if (!m) { pushOut('Unrecognized command. Type "help".'); return }

  const method = m[1].toUpperCase() as 'GET'|'POST'|'PUT'|'DELETE'
  const path = m[2]
  const bodyRaw = m[3]

  let body: any = undefined
  if (bodyRaw) {
    try { body = JSON.parse(bodyRaw) }
    catch { pushOut('Invalid JSON body.'); return }
  }

  try {
    const res = await fetch(baseUrl.value.replace(/\/+$/,'') + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    })
    const text = await res.text()
    pushOut('HTTP ' + res.status)
    try { pushOut(JSON.stringify(JSON.parse(text), null, 2)) }
    catch { pushOut(text) }
  } catch (e: any) {
    pushOut('Error: ' + (e?.message || String(e)))
  }
}

/** ============== API EXPLORER ============== */
type ParamGroup = Record<string, string>
type Operation = {
  summary?: string
  description?: string
  params?: { path?: ParamGroup; query?: ParamGroup }
  headers?: ParamGroup
  body?: any
}
type Spec = {
  baseUrl?: string
  paths: Record<string, Partial<Record<'GET'|'POST'|'PUT'|'DELETE', Operation>>>
}

const props = withDefaults(defineProps<{ spec?: Spec }>(), {})
const spec = computed<Spec>(() => props.spec || demoSpec())

const currentPathKey = ref<string>('')

const method = ref<'GET'|'POST'|'PUT'|'DELETE'>(firstMethodFor(currentPathKey.value))
watch(spec, () => { method.value = firstMethodFor(currentPathKey.value) })
watch(currentPathKey, (k) => { method.value = firstMethodFor(k) })
function firstMethodFor(k: string): 'GET'|'POST'|'PUT'|'DELETE' {
  const ops = spec.value.paths[k] || {}
  return (Object.keys(ops)[0] as any) || 'GET'
}

/* color-coded method pills */
function methodClass(m: string) {
  switch (m) {
    case 'GET': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800'
    case 'POST': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200/60 dark:border-blue-800'
    case 'PUT': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200/60 dark:border-amber-800'
    case 'DELETE': return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200/60 dark:border-rose-800'
    default: return ''
  }
}

const availableMethods = computed(
  () => {
    const ops = spec.value.paths[currentPathKey.value]
    const list = (ops ? Object.keys(ops) : ['GET','POST','PUT','DELETE']) as Array<'GET'|'POST'|'PUT'|'DELETE'>
    // keep a stable order
    const order = ['GET','POST','PUT','DELETE']
    return list.sort((a, b) => order.indexOf(a) - order.indexOf(b))
  }
)

const operation = computed<Operation>(() => (spec.value.paths[currentPathKey.value] || {})[method.value] || {})

/* path/query seed from spec */
const paramValues = ref<{ path: Record<string,string>, query: Record<string,string> }>({ path: {}, query: {} })

/* dynamic lists */
type KVRow = { enabled: boolean; key: string; value: string }
const queryList  = ref<KVRow[]>([])
const headerList = ref<KVRow[]>([])
const cookieList = ref<KVRow[]>([])

watch(operation, (op) => {
  paramValues.value = {
    path: Object.fromEntries(Object.keys(op.params?.path || {}).map(k => [k, ''])),
    query: Object.fromEntries(Object.keys(op.params?.query || {}).map(k => [k, '']))
  }
  headerList.value = Object.keys(op.headers || {}).map(k => ({ enabled: true, key: k, value: (op.headers as any)[k] || '' }))
  if (!queryList.value.length) queryList.value.push({ enabled: true, key: '', value: '' })
  if (!headerList.value.length) headerList.value.push({ enabled: true, key: '', value: '' })
  if (!cookieList.value.length) cookieList.value.push({ enabled: true, key: '', value: '' })
}, { immediate: true })

const supportsBody = computed(() => method.value === 'POST' || method.value === 'PUT' || method.value === 'DELETE')

/* Form tabs (Path tab removed) */
const formTabs = [
  { key: 'security', label: 'Security', icon: 'lucide:shield' },
  { key: 'body',     label: 'Body',     icon: 'lucide:code-2' },
  { key: 'query',    label: 'Query',    icon: 'lucide:search' },
  { key: 'headers',  label: 'Headers',  icon: 'lucide:list-plus' },
  { key: 'cookies',  label: 'Cookies',  icon: 'lucide:cookie' },
] as const
const formTab = ref<typeof formTabs[number]['key']>('body')

/* rows helpers */
function addQuery()  { queryList.value.push({ enabled: true, key: '', value: '' }) }
function removeQuery(i: number)  { queryList.value.splice(i, 1) }
function addHeader() { headerList.value.push({ enabled: true, key: '', value: '' }) }
function removeHeader(i: number) { headerList.value.splice(i, 1) }
function addCookie() { cookieList.value.push({ enabled: true, key: '', value: '' }) }
function removeCookie(i: number) { cookieList.value.splice(i, 1) }

/* Authorization helper (Security tab) */
const hasAuth = computed(() => headerList.value.some(r => r.enabled && r.key.toLowerCase() === 'authorization'))
const authRowIndex = computed(() => headerList.value.findIndex(r => r.key.toLowerCase() === 'authorization'))
const authValue = computed({
  get: () => {
    const idx = authRowIndex.value
    return idx >= 0 ? headerList.value[idx].value : 'Bearer '
  },
  set: (v: string) => {
    const idx = authRowIndex.value
    if (idx >= 0) headerList.value[idx].value = v
  }
})
function toggleAuth() {
  const idx = authRowIndex.value
  if (idx >= 0) headerList.value.splice(idx, 1)
  else headerList.value.unshift({ enabled: true, key: 'Authorization', value: 'Bearer ' })
}

/* build URL / headers / cookies */
function buildPath() {
  let p = currentPathKey.value || ''
  for (const k of Object.keys(paramValues.value.path)) {
    p = p.replace(new RegExp('\\{' + k + '\\}', 'g'), encodeURIComponent(paramValues.value.path[k] || ''))
  }
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(paramValues.value.query)) {
    if (v != null && String(v).length) qs.append(k, String(v))
  }
  for (const row of queryList.value) {
    if (!row.enabled || !row.key) continue
    qs.append(row.key, row.value ?? '')
  }
  const q = qs.toString()
  return q ? p + '?' + q : p
}
const builtPath = computed(buildPath)
const builtUrl = computed(() => (baseUrl.value || spec.value.baseUrl || '').replace(/\/+$/,'') + builtPath.value)

/* Body / code */
const showCode = ref(false)
const bodyText = ref<string>('')
function formatBody() {
  if (!bodyText.value.trim()) return
  try { bodyText.value = JSON.stringify(JSON.parse(bodyText.value), null, 2) } catch {}
}
const curlHeaders = computed(() => {
  const entries: [string,string][] = []
  for (const r of headerList.value) {
    if (!r.enabled || !r.key) continue
    entries.push([r.key, r.value ?? ''])
  }
  const cookieStr = cookieList.value
    .filter(r => r.enabled && r.key)
    .map(r => `${r.key}=${r.value ?? ''}`)
    .join('; ')
  if (cookieStr) entries.push(['Cookie', cookieStr])

  if (!entries.length) return ''
  const parts = entries.map(([k, v]) => " \\\n  -H '" + k + ": " + String(v).replace(/'/g, "'\\''") + "'")
  return parts.join('')
})
const curlBody = computed(() => {
  if (!supportsBody.value) return ''
  const t = bodyText.value.trim()
  if (!t) return ''
  const safe = t.replace(/'/g, "'\\''")
  return " \\\n  -d '" + safe + "'"
})
async function copyCurl() {
  const cmd = "curl -X " + method.value + " '" + builtUrl.value + "'" + curlHeaders.value + curlBody.value
  try { await navigator.clipboard.writeText(cmd) } catch {}
}

/* Response meta + helpers */
const statusCode = ref<number | null>(null)
const elapsedMs = ref<number | null>(null)
const respBytes = ref<number | null>(null)
const respDisplay = ref<string>('')
const respRaw = ref<string>('')

const statusDotClass = computed(() => {
  const s = statusCode.value ?? 0
  if (s >= 200 && s < 300) return 'bg-emerald-500'
  if (s >= 300 && s < 400) return 'bg-amber-500'
  return 'bg-rose-500'
})
function prettyBytes(n: number) {
  if (n < 1024) return `${n} B`
  const kb = n / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}
async function copyResponse() {
  try { await navigator.clipboard.writeText(respRaw.value || '') } catch {}
}

const loading = ref(false)
async function runRequest() {
  loading.value = true
  respDisplay.value = ''
  respRaw.value = ''
  statusCode.value = null
  elapsedMs.value = null
  respBytes.value = null

  const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
  try {
    const headers: Record<string,string> = {}
    for (const r of headerList.value) {
      if (!r.enabled || !r.key) continue
      headers[r.key] = r.value ?? ''
    }
    const cookieStr = cookieList.value
      .filter(r => r.enabled && r.key)
      .map(r => `${r.key}=${r.value ?? ''}`)
      .join('; ')
    if (cookieStr) headers['Cookie'] = cookieStr

    const init: any = { method: method.value, headers }
    if (supportsBody.value && bodyText.value.trim()) {
      init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json'
      init.body = bodyText.value
    }

    const res = await fetch(builtUrl.value, init)
    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
    elapsedMs.value = Math.max(0, Math.round(t1 - t0))
    statusCode.value = res.status

    const text = await res.text()
    respRaw.value = text
    respBytes.value = (typeof TextEncoder !== 'undefined') ? new TextEncoder().encode(text).length : text.length

    let out = 'HTTP ' + res.status + '\n'
    try { out += JSON.stringify(JSON.parse(text), null, 2) }
    catch { out += text }
    respDisplay.value = out
  } catch (e: any) {
    const t1 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
    elapsedMs.value = Math.max(0, Math.round(t1 - t0))
    statusCode.value = 0
    respBytes.value = 0
    respDisplay.value = 'Error: ' + (e?.message || String(e)))
  } finally {
    loading.value = false
  }
}

/** Tiny demo spec if none passed */
function demoSpec(): Spec {
  return {
    baseUrl: 'https://httpbin.org',
    paths: {
      '/anything': {
        GET: {
          summary: 'Echo query/headers/body',
          params: { query: { limit: 'number', after: 'string' } }
        },
        POST: {
          summary: 'Echo POST body',
          headers: { 'X-Demo': '' },
          body: { example: true }
        }
      },
      '/anything/{id}': {
        GET: {
          summary: 'Get by ID (echo)',
          params: { path: { id: 'string' }, query: { expand: 'string' } }
        }
      }
    }
  }
}
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.slide-up-enter-active, .slide-up-leave-active { transition: transform .2s ease, opacity .2s ease; }
.slide-up-enter-from, .slide-up-leave-to { transform: translateY(12px); opacity: 0; }
</style>




