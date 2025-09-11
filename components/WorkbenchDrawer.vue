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
            <div class="space-y-1">
              <label class="text-xs opacity-70">Resource / Path</label>
              <select
                v-model="currentPathKey"
                class="w-full rounded-md border px-2 py-1.5 text-sm
                       border-neutral-200 dark:border-neutral-800
                       bg-white dark:bg-neutral-900"
              >
                <option
                  v-for="(p, key) in spec.paths"
                  :key="key"
                >{{ key }}</option>
              </select>
            </div>

            <div class="space-y-1">
              <label class="text-xs opacity-70">Method</label>
              <select
                v-model="method"
                class="w-full rounded-md border px-2 py-1.5 text-sm
                       border-neutral-200 dark:border-neutral-800
                       bg-white dark:bg-neutral-900"
              >
                <option v-for="m in availableMethods" :key="m">{{ m }}</option>
              </select>
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
            <div class="flex-1 overflow-auto p-4 space-y-4">
              <!-- Path params -->
              <div v-if="pathParamKeys.length" class="space-y-2">
                <div class="text-xs font-semibold">Path Parameters</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label v-for="k in pathParamKeys" :key="k" class="text-xs">
                    <span class="block opacity-70">{{ k }}</span>
                    <input
                      v-model="paramValues.path[k]"
                      class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm
                             border-neutral-200 dark:border-neutral-800
                             bg-white dark:bg-neutral-900"
                      :placeholder="'e.g. 123'"
                    />
                  </label>
                </div>
              </div>

              <!-- Query params -->
              <div v-if="queryParamKeys.length" class="space-y-2">
                <div class="text-xs font-semibold">Query Parameters</div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label v-for="k in queryParamKeys" :key="k" class="text-xs">
                    <span class="block opacity-70">{{ k }}</span>
                    <input
                      v-model="paramValues.query[k]"
                      class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm
                             border-neutral-200 dark:border-neutral-800
                             bg-white dark:bg-neutral-900"
                      :placeholder="'value'"
                    />
                  </label>
                </div>
              </div>

              <!-- Headers -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="text-xs font-semibold">Headers</div>
                  <button
                    class="text-xs opacity-70 hover:opacity-100"
                    @click="toggleAuth()"
                  >{{ hasAuth ? 'Remove Authorization' : 'Add Authorization' }}</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <label v-for="(val, k) in headerValues" :key="k" class="text-xs">
                    <span class="block opacity-70">{{ k }}</span>
                    <input
                      v-model="headerValues[k]"
                      class="mt-1 w-full rounded-md border px-2 py-1.5 text-sm
                             border-neutral-200 dark:border-neutral-800
                             bg-white dark:bg-neutral-900"
                      :placeholder="'value'"
                    />
                  </label>
                </div>
              </div>

              <!-- Body -->
              <div v-if="supportsBody" class="space-y-2">
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
            <div v-if="resp" class="border-t border-neutral-200 dark:border-neutral-800 p-4 overflow-auto max-h-[40vh]">
              <div class="text-xs mb-2 opacity-70">Response</div>
              <pre class="text-xs whitespace-pre-wrap break-words">{{ resp }}</pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
// v-model:open
const open = defineModel<boolean>('open', { default: false })
const close = () => { open.value = false }

import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue'

/** -------- keyboard toggle (Ctrl + `) -------- */
function onKey(e: KeyboardEvent) {
  if (e.ctrlKey && e.key === '`') {
    e.preventDefault()
    open.value = !open.value
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))

+/** -------- resizable height (SSR-safe) -------- */
+const height = ref<number>(560) // default for SSR
+onMounted(() => {
+  height.value = Math.min(560, Math.round(window.innerHeight * 0.7))
+})
const heightPx = computed(() => `${height.value}px`)
let dragging = false
let startY = 0
let startH = 0
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
  const next = Math.max(240, Math.min(window.innerHeight - 64, startH + delta))
  height.value = next
}
function stopDrag() {
  dragging = false
  window.removeEventListener('pointermove', onDrag)
  window.removeEventListener('pointerup', stopDrag)
}

/** -------- Tabs -------- */
const tabs = ['Shell', 'API Explorer'] as const
const activeTab = ref<typeof tabs[number]>('Shell')

/** ==========================================================
 *  SHELL (minimal CLI to hit your API)
 *  Commands:
 *   - help
 *   - set base <url>
 *   - get|post|put|delete <path> [json]
 * ========================================================== */
type ShellLine = { kind: 'in' | 'out'; text: string }
const shellLines = ref<ShellLine[]>([
  { kind: 'out', text: 'Welcome to ESW Catalog Shell!' },
  { kind: 'out', text: 'Type "help" to see available commands.' }
])
const shellInput = ref('')
const baseUrl = ref('https://httpbin.org') // change on page via prop if you like

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
      headers: {
        'Content-Type': 'application/json'
      },
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

/** ==========================================================
 *  API EXPLORER (very small, schema-driven)
 *  Props: spec (optional) — if not provided, we use a tiny demo spec.
 * ========================================================== */
type ParamGroup = Record<string, string>
type Operation = {
  summary?: string
  description?: string
  params?: { path?: ParamGroup; query?: ParamGroup }
  headers?: ParamGroup
  body?: any // JSON schema-ish (not enforced here)
}
type Spec = {
  baseUrl?: string
  paths: Record<string, Partial<Record<'GET'|'POST'|'PUT'|'DELETE', Operation>>>
}

const props = withDefaults(defineProps<{
  spec?: Spec
}>(), {})

const spec = computed<Spec>(() => props.spec || demoSpec())

const currentPathKey = ref<string>(Object.keys(spec.value.paths)[0] || '/')
const method = ref<'GET'|'POST'|'PUT'|'DELETE'>(firstMethodFor(currentPathKey.value))

watch(spec, () => {
  const first = Object.keys(spec.value.paths)[0] || '/'
  currentPathKey.value = first
  method.value = firstMethodFor(first)
})

watch(currentPathKey, (k) => {
  method.value = firstMethodFor(k)
})

function firstMethodFor(k: string): 'GET'|'POST'|'PUT'|'DELETE' {
  const ops = spec.value.paths[k] || {}
  return (Object.keys(ops)[0] as any) || 'GET'
}

const availableMethods = computed(() => Object.keys(spec.value.paths[currentPathKey.value] || {}) as Array<'GET'|'POST'|'PUT'|'DELETE'>)
const operation = computed<Operation>(() => (spec.value.paths[currentPathKey.value] || {})[method.value] || {})

const paramValues = ref<{ path: Record<string,string>, query: Record<string,string> }>({ path: {}, query: {} })
const headerValues = ref<Record<string,string>>({})
const bodyText = ref<string>('')

watch(operation, (op) => {
  // init params
  paramValues.value = {
    path: Object.fromEntries(Object.keys(op.params?.path || {}).map(k => [k, ''])),
    query: Object.fromEntries(Object.keys(op.params?.query || {}).map(k => [k, '']))
  }
  // init headers
  headerValues.value = Object.fromEntries(Object.keys(op.headers || {}).map(k => [k, (op.headers as any)[k] || '']))
  // init body
  bodyText.value = op.body ? JSON.stringify(op.body, null, 2) : ''
}, { immediate: true })

const pathParamKeys = computed(() => Object.keys(operation.value.params?.path || {}))
const queryParamKeys = computed(() => Object.keys(operation.value.params?.query || {}))
const supportsBody = computed(() => method.value === 'POST' || method.value === 'PUT' || method.value === 'DELETE')

function buildPath() {
  let p = currentPathKey.value
  for (const k of Object.keys(paramValues.value.path)) {
    p = p.replace(new RegExp('\\{' + k + '\\}', 'g'), encodeURIComponent(paramValues.value.path[k] || ''))
  }
  const qs = new URLSearchParams()
  for (const [k, v] of Object.entries(paramValues.value.query)) {
    if (v != null && String(v).length) qs.append(k, String(v))
  }
  const q = qs.toString()
  return q ? p + '?' + q : p
}
const builtPath = computed(buildPath)
const builtUrl = computed(() => (baseUrl.value || spec.value.baseUrl || '').replace(/\/+$/,'') + builtPath.value)

const hasAuth = computed(() => !!headerValues.value['Authorization'])
function toggleAuth() {
  if (hasAuth.value) delete headerValues.value['Authorization']
  else headerValues.value['Authorization'] = 'Bearer '
}

function formatBody() {
  if (!bodyText.value.trim()) return
  try { bodyText.value = JSON.stringify(JSON.parse(bodyText.value), null, 2) } catch {}
}

const showCode = ref(false)
const curlHeaders = computed(() => {
  const entries = Object.entries(headerValues.value).filter(([_, v]) => v != null && String(v).length)
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

const loading = ref(false)
const resp = ref<string>('')

async function runRequest() {
  loading.value = true
  resp.value = ''
  try {
    const init: any = {
      method: method.value,
      headers: { ...headerValues.value }
    }
    if (supportsBody.value && bodyText.value.trim()) {
      init.headers['Content-Type'] = init.headers['Content-Type'] || 'application/json'
      init.body = bodyText.value
    }
    const res = await fetch(builtUrl.value, init)
    const text = await res.text()
    let out = 'HTTP ' + res.status + '\n'
    try { out += JSON.stringify(JSON.parse(text), null, 2) }
    catch { out += text }
    resp.value = out
  } catch (e: any) {
    resp.value = 'Error: ' + (e?.message || String(e))
  } finally {
    loading.value = false
  }
}

/** -------- Tiny demo spec if none passed -------- */
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
