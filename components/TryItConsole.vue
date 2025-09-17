<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  title?: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** Optional. If provided, it's used only as the initial value (no prefill required). */
  path?: string
  environments: { label: string; baseUrl: string }[]
  auth?: 'none' | 'bearer' | 'apikey'
  apikeyHeader?: string
  contentTypes?: string[]
  defaultBody?: string
  defaultQuery?: Record<string, string>
  defaultHeaders?: Record<string, string>
  examplePicker?: { [label: string]: string } // label -> body string
}>(), {
  title: undefined,
  auth: 'none',
  apikeyHeader: 'x-api-key',
  contentTypes: () => ['application/json'],
  defaultBody: '',
  defaultQuery: () => ({}),
  defaultHeaders: () => ({})
})

// state
const envIdx = ref(0)
/** Editable Resource/Path input; defaults to empty (no prefill). */
const pathInput = ref(props.path ?? '')

const selectedContentType = ref(props.contentTypes[0])
const body = ref(props.defaultBody)
const query = ref(Object.entries(props.defaultQuery).map(([k, v]) => ({ enabled: true, key: k, value: v })))
const headers = ref(Object.entries(props.defaultHeaders).map(([k, v]) => ({ enabled: true, key: k, value: v })))

// auth
const bearer = ref('')
const apikey = ref('')

// response
const sending = ref(false)
const status = ref<number | null>(null)
const timeMs = ref<number | null>(null)
const sizeBytes = ref<number | null>(null)
const respBody = ref('')
const respHeaders = ref<Record<string, string>>({})
const respCookies = ref<{ name: string; value: string }[]>([])

function buildBase() {
  return props.environments[envIdx.value]?.baseUrl?.replace(/\/$/, '') || ''
}

function joinUrlAndQuery(u: string, q: string) {
  if (!q) return u
  return u.includes('?') ? `${u}&${q}` : `${u}?${q}`
}

function computeURL() {
  const p = (pathInput.value || '').trim()
  const q = query.value
    .filter(r => r.enabled && r.key)
    .map(r => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value ?? '')}`)
    .join('&')

  // If user pasted a full absolute URL, use it directly.
  if (/^https?:\/\//i.test(p)) {
    return joinUrlAndQuery(p, q)
  }

  const base = buildBase()
  if (!p) return joinUrlAndQuery(base, q) // allow calling just the base if desired

  const withSlash = p.startsWith('/') ? p : `/${p}`
  return joinUrlAndQuery(`${base}${withSlash}`, q)
}

const urlPreview = computed(() => computeURL())

const curl = computed(() => {
  const url = computeURL()
  const h: Record<string, string> = {}
  headers.value.filter(hh => hh.enabled && hh.key).forEach(hh => { h[hh.key] = hh.value })
  if (props.auth === 'bearer' && bearer.value) h['Authorization'] = `Bearer ${bearer.value}`
  if (props.auth === 'apikey' && apikey.value) h[props.apikeyHeader] = apikey.value
  if (['POST','PUT','PATCH'].includes(props.method) && selectedContentType.value) h['Content-Type'] = selectedContentType.value
  const headerFlags = Object.entries(h).map(([k,v]) => `-H ${JSON.stringify(`${k}: ${v}`)}`).join(' ')
  const dataFlag = ['POST','PUT','PATCH'].includes(props.method) && body.value?.length ? `--data ${JSON.stringify(body.value)}` : ''
  return `curl -X ${props.method} ${headerFlags} ${JSON.stringify(url)} ${dataFlag}`.trim()
})

async function send() {
  try {
    sending.value = true
    status.value = null
    timeMs.value = null
    sizeBytes.value = null
    respBody.value = ''
    respHeaders.value = {}
    respCookies.value = []

    const h: Record<string, string> = {}
    headers.value.filter(hh => hh.enabled && hh.key).forEach(hh => { h[hh.key] = hh.value })
    if (props.auth === 'bearer' && bearer.value) h['Authorization'] = `Bearer ${bearer.value}`
    if (props.auth === 'apikey' && apikey.value) h[props.apikeyHeader] = apikey.value
    if (['POST','PUT','PATCH'].includes(props.method) && selectedContentType.value) h['Content-Type'] = selectedContentType.value

    const r = await $fetch<{
      status:number; size:number; timeMs:number;
      headers:Record<string,string>; cookies:{name:string;value:string}[]; body:string
    }>('/api/tryit', {
      method: 'POST',
      body: {
        url: computeURL(),
        method: props.method,
        headers: h,
        body: ['POST','PUT','PATCH'].includes(props.method) ? body.value : undefined,
      },
    })

    status.value = r.status
    timeMs.value = r.timeMs
    sizeBytes.value = r.size
    respHeaders.value = r.headers
    respCookies.value = r.cookies
    respBody.value = r.body
  } catch (e: any) {
    status.value = 0
    respBody.value = e?.data?.message || e?.message || 'Request failed'
  } finally {
    sending.value = false
  }
}

function bytesFmt(n?: number | null) {
  if (!n && n !== 0) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1024*1024) return `${(n/1024).toFixed(1)} KB`
  return `${(n/1024/1024).toFixed(1)} MB`
}

const exampleLabels = computed(() => Object.keys(props.examplePicker || {}))
function loadExample(label: string) {
  const ex = props.examplePicker?.[label]
  if (ex) body.value = ex
}
</script>

<template>
  <div class="w-full rounded-xl border bg-background shadow-sm">
    <div class="p-4 border-b">
      <div class="flex flex-wrap items-center gap-2">
        <span class="px-2 py-1 text-xs uppercase tracking-wide rounded bg-muted text-foreground">
          {{ method }}
        </span>
        <h2 class="font-semibold truncate">{{ title || (pathInput || 'Enter Resource Path') }}</h2>
      </div>

      <div class="mt-3 grid gap-2 md:grid-cols-[auto,1fr,auto] items-center">
        <select v-model="envIdx" class="w-80 px-2 py-2 rounded border bg-background">
          <option v-for="(env,i) in environments" :key="i" :value="i">
            {{ env.label }} — {{ env.baseUrl }}
          </option>
        </select>

        <!-- Editable Resource / Path (now empty by default) -->
        <input
          v-model="pathInput"
          class="w-full px-2 py-2 rounded border font-mono bg-muted/30"
          placeholder="/api/v2/YourEndpoint or https://api.example.com/api/v2/YourEndpoint"
        />

        <button :disabled="sending" @click="send"
                class="px-3 py-2 rounded bg-primary text-primary-foreground disabled:opacity-50">
          {{ sending ? 'Sending…' : 'Send' }}
        </button>
      </div>

      <div class="mt-2 text-sm text-muted-foreground">
        Resolved URL: <code class="font-mono break-all">{{ urlPreview }}</code>
      </div>
      <div class="mt-1 text-sm text-muted-foreground">
        cURL: <code class="font-mono break-all">{{ curl }}</code>
      </div>
    </div>

    <div class="p-4">
      <div class="flex gap-2 text-sm font-medium mb-3">
        <a href="#try-body" class="px-2 py-1 rounded bg-muted">Body</a>
        <a href="#try-query" class="px-2 py-1 rounded bg-muted">Query</a>
        <a href="#try-headers" class="px-2 py-1 rounded bg-muted">Headers</a>
        <a href="#try-auth" class="px-2 py-1 rounded bg-muted">Auth</a>
      </div>

      <!-- Body -->
      <section id="try-body" class="space-y-3 mb-6">
        <h3 class="font-semibold">Body</h3>
        <div v-if="['POST','PUT','PATCH'].includes(method)" class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <label class="text-sm">Content-Type</label>
            <select v-model="selectedContentType" class="w-80 px-2 py-2 rounded border bg-background">
              <option v-for="ct in contentTypes" :key="ct" :value="ct">{{ ct }}</option>
            </select>

            <div v-if="exampleLabels.length" class="flex items-center gap-2">
              <span class="text-sm">Pick example</span>
              <select class="w-64 px-2 py-2 rounded border bg-background"
                      @change="loadExample(($event.target as HTMLSelectElement).value)">
                <option value="" selected disabled>Choose…</option>
                <option v-for="lbl in exampleLabels" :key="lbl" :value="lbl">{{ lbl }}</option>
              </select>
            </div>
          </div>
          <JsonEditor v-model="body" />
        </div>
        <div v-else class="text-sm text-muted-foreground">No body for {{ method }}.</div>
      </section>

      <!-- Query -->
      <section id="try-query" class="mb-6">
        <h3 class="font-semibold mb-2">Query</h3>
        <KeyValueEditor v-model:rows="query" add-label="Add query" />
      </section>

      <!-- Headers -->
      <section id="try-headers" class="mb-6">
        <h3 class="font-semibold mb-2">Headers</h3>
        <KeyValueEditor v-model:rows="headers" add-label="Add header" />
      </section>

      <!-- Auth -->
      <section id="try-auth" class="mb-6">
        <h3 class="font-semibold mb-2">Auth</h3>
        <div v-if="auth==='bearer'" class="space-y-2">
          <label class="text-sm">Bearer token</label>
          <input v-model="bearer" type="password" class="w-full px-2 py-2 rounded border bg-background" placeholder="Paste token…" />
        </div>
        <div v-else-if="auth==='apikey'" class="space-y-2">
          <label class="text-sm">API key ({{ apikeyHeader }})</label>
          <input v-model="apikey" type="password" class="w-full px-2 py-2 rounded border bg-background" placeholder="Paste key…" />
        </div>
        <div v-else class="text-sm text-muted-foreground">No auth required.</div>
      </section>

      <!-- Response -->
      <section class="mt-6 rounded-lg border p-4">
        <div class="flex flex-wrap items-center gap-3 text-sm">
          <span v-if="status!==null" class="px-2 py-1 rounded bg-muted">Status: {{ status }}</span>
          <span class="px-2 py-1 rounded bg-muted">Time: {{ timeMs ?? '—' }} ms</span>
          <span class="px-2 py-1 rounded bg-muted">Size: {{ bytesFmt(sizeBytes) }}</span>
        </div>
        <div class="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <h4 class="font-semibold mb-2">Response Body</h4>
            <pre class="bg-muted rounded p-3 overflow-auto text-sm"><code>{{ respBody }}</code></pre>
          </div>
          <div>
            <h4 class="font-semibold mb-2">Response Headers</h4>
            <pre class="bg-muted rounded p-3 overflow-auto text-sm"><code>{{ respHeaders }}</code></pre>
            <h4 class="font-semibold mt-4 mb-2">Cookies</h4>
            <pre class="bg-muted rounded p-3 overflow-auto text-sm"><code>{{ respCookies }}</code></pre>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>


