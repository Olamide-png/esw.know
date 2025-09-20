<!-- components/ApiEndpointTryIt.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'

// shadcn/ui components (paths align with shadcn-docs-nuxt convention)
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

// ---------- Props ----------
type HttpMethod = 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'
type Dict = Record<string, any>

const props = withDefaults(defineProps<{
  method: HttpMethod
  path: string // e.g., "/project/update/{projectId}"
  baseUrl?: string // e.g., "https://api.example.com"
  title?: string
  // Pre-populated fields
  defaults?: {
    path?: Dict
    query?: Dict
    headers?: Dict
    body?: any
    auth?: { type?: 'none'|'bearer'|'basic', token?: string, username?: string, password?: string }
  }
  // Optional list of base URLs to pick from (useful for environments)
  baseUrls?: string[]
  // Optional set of methods to allow switching (defaults to prop.method only)
  allowMethodSwitch?: boolean
}>(), {
  baseUrl: '',
  title: '',
  defaults: () => ({}),
  baseUrls: () => [],
  allowMethodSwitch: false
})

// ---------- State ----------
const open = ref(false)
const envBaseUrl = ref(props.baseUrl || (props.baseUrls[0] || ''))
const method = ref<HttpMethod>(props.method)
const livePath = ref(props.path) // for quick edits if needed
const pathParams = ref<Dict>({ ...(props.defaults?.path || {}) })
const queryParams = ref<Dict>({ ...(props.defaults?.query || {}) })
const headers = ref<Dict>({ 'Content-Type': 'application/json', ...(props.defaults?.headers || {}) })
const auth = ref<{type:'none'|'bearer'|'basic', token?:string, username?:string, password?:string}>({
  type: props.defaults?.auth?.type || 'none',
  token: props.defaults?.auth?.token,
  username: props.defaults?.auth?.username,
  password: props.defaults?.auth?.password
})
const bodyRaw = ref(
  typeof props.defaults?.body === 'undefined'
    ? ''
    : tryStringify(props.defaults?.body)
)
const sending = ref(false)
const responseStatus = ref<number|null>(null)
const responseTimeMs = ref<number|null>(null)
const responseHeaders = ref<Dict>({})
const responseText = ref<string>('')

// ---------- Helpers ----------
function tryStringify(v: any) {
  try { return JSON.stringify(v, null, 2) } catch { return String(v) }
}
function isJsonContent(): boolean {
  const ct = String(headers.value['Content-Type'] || headers.value['content-type'] || '').toLowerCase()
  return ct.includes('application/json')
}
function parsedBody(): any {
  if (!bodyRaw.value?.trim()) return undefined
  if (isJsonContent()) {
    try { return JSON.parse(bodyRaw.value) } catch { /* fallthrough */ }
  }
  return bodyRaw.value
}

function buildUrl(): string {
  // 1) substitute path params {param}
  let p = livePath.value.replace(/\{(\w+)\}/g, (_, k) => {
    const v = pathParams.value?.[k]
    return encodeURIComponent(v ?? `{${k}}`)
  })
  // 2) append query string
  const entries = Object.entries(queryParams.value || {}).filter(([,v]) => v !== '' && v !== null && typeof v !== 'undefined')
  const qs = new URLSearchParams(entries as any).toString()
  const base = envBaseUrl.value?.trim() ? envBaseUrl.value.replace(/\/+$/,'') : ''
  return base + p + (qs ? `?${qs}` : '')
}

const curl = computed(() => {
  const h = Object.entries(headers.value || {})
    .filter(([,v]) => String(v).length)
    .map(([k,v]) => `-H ${sh(`${k}: ${v}`)}`)
  const body = parsedBody()
  const bodyPart = (method.value === 'GET' || method.value === 'DELETE') ? '' :
    (typeof body === 'undefined' ? '' : ` \\\n  --data ${sh(isJsonContent() ? JSON.stringify(body) : String(body))}`)
  const authPart =
    auth.value.type === 'bearer' && auth.value.token ? ` \\\n  -H ${sh('Authorization: Bearer ' + auth.value.token)}`
    : auth.value.type === 'basic' && auth.value.username ? ` \\\n  -u ${sh(`${auth.value.username}:${auth.value.password || ''}`)}`
    : ''
  return [
    'curl', '-X', method.value,
    ...h,
    authPart.trim(),
    sh(buildUrl())
  ].filter(Boolean).join(' ') + bodyPart
})
function sh(s:string){ // shell-escape minimal
  const q = `'`
  return q + String(s).replace(/'/g, `'\\''`) + q
}

const methodColor = computed(() => {
  switch (method.value) {
    case 'GET': return 'bg-emerald-600 text-white'
    case 'POST': return 'bg-blue-600 text-white'
    case 'PUT': return 'bg-amber-600 text-white'
    case 'PATCH': return 'bg-violet-600 text-white'
    case 'DELETE': return 'bg-rose-600 text-white'
    default: return 'bg-gray-600 text-white'
  }
})

const pathSegments = computed(() => {
  // split into static vs {param}
  const segs: Array<{text:string, isParam:boolean}> = []
  livePath.value.split('/').filter(Boolean).forEach(seg => {
    const m = seg.match(/^\{(\w+)\}$/)
    if (m) segs.push({ text: m[1], isParam: true })
    else segs.push({ text: seg, isParam: false })
  })
  return segs
})

// ---------- Key rename helper for editable maps ----------
function renameKv(target: 'query' | 'headers', oldKey: string, newKey: string) {
  if (!newKey || newKey === oldKey) return
  const src = target === 'query' ? { ...queryParams.value } : { ...headers.value }
  if (!Object.prototype.hasOwnProperty.call(src, oldKey)) return
  const val = src[oldKey]
  delete src[oldKey]
  let key = newKey
  let i = 1
  while (Object.prototype.hasOwnProperty.call(src, key)) {
    key = `${newKey}_${i++}`
  }
  ;(src as any)[key] = val
  if (target === 'query') queryParams.value = src
  else headers.value = src
}

// ---------- Actions ----------
async function sendRequest() {
  sending.value = true
  responseStatus.value = null
  responseTimeMs.value = null
  responseHeaders.value = {}
  responseText.value = ''

  const url = buildUrl()
  const init: RequestInit = { method: method.value, headers: { ...headers.value } }

  // auth
  if (auth.value.type === 'bearer' && auth.value.token) {
    (init.headers as any)['Authorization'] = `Bearer ${auth.value.token}`
  } else if (auth.value.type === 'basic' && auth.value.username) {
    const token = btoa(`${auth.value.username}:${auth.value.password || ''}`)
    (init.headers as any)['Authorization'] = `Basic ${token}`
  }

  // body
  if (!['GET','DELETE'].includes(method.value)) {
    const body = parsedBody()
    if (typeof body !== 'undefined') {
      init.body = isJsonContent() && typeof body !== 'string' ? JSON.stringify(body) : (body as any)
    }
  }

  const t0 = performance.now()
  try {
    const res = await fetch(url, init)
    const t1 = performance.now()
    responseStatus.value = res.status
    responseTimeMs.value = Math.round(t1 - t0)
    // headers
    const hh: Dict = {}
    res.headers.forEach((v, k) => { hh[k] = v })
    responseHeaders.value = hh
    // body text
    const txt = await res.text()
    try {
      const obj = JSON.parse(txt)
      responseText.value = JSON.stringify(obj, null, 2)
    } catch {
      responseText.value = txt
    }
  } catch (e:any) {
    const t1 = performance.now()
    responseStatus.value = -1
    responseTimeMs.value = Math.round(t1 - t0)
    responseText.value = `Request failed: ${e?.message || e}`
  } finally {
    sending.value = false
  }
}

function addKv(target:'path'|'query'|'headers') {
  const obj = target === 'path' ? pathParams.value : target === 'query' ? queryParams.value : headers.value
  const copy = { ...obj }
  let i = 1
  while (copy[`key${i}`] !== undefined) i++
  copy[`key${i}`] = ''
  if (target === 'path') pathParams.value = copy
  else if (target === 'query') queryParams.value = copy
  else headers.value = copy
}
function removeKv(target:'path'|'query'|'headers', k:string) {
  const obj = target === 'path' ? pathParams.value : target === 'query' ? queryParams.value : headers.value
  const copy: Dict = {}
  Object.keys(obj).forEach(key => { if (key !== k) copy[key] = obj[key] })
  if (target === 'path') pathParams.value = copy
  else if (target === 'query') queryParams.value = copy
  else headers.value = copy
}
function copyToClipboard(text:string) {
  navigator.clipboard?.writeText(text).catch(() => {})
}
</script>

<template>
  <!-- Endpoint pill -->
  <div class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-neutral-900/60 px-3 py-2 shadow-sm">
    <div class="flex items-center gap-3">
      <Badge :class="['px-2 py-1 text-xs font-semibold', methodColor]">{{ method }}</Badge>
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
    <Button variant="default" class="rounded-lg" @click="open = true">
      Try it ▶
    </Button>
  </div>

  <!-- Modal -->
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-4xl md:max-w-5xl lg:max-w-6xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Badge :class="['px-2 py-1 text-xs font-semibold', methodColor]">{{ method }}</Badge>
          <span class="font-mono text-base">{{ livePath }}</span>
        </DialogTitle>
        <DialogDescription class="text-sm">
          Configure the request and run it. Fields are pre-filled from <code>defaults</code>.
        </DialogDescription>
      </DialogHeader>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Left: Request builder -->
        <Card class="overflow-hidden">
          <CardHeader class="pb-2">
            <CardTitle class="text-base">Request</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div v-if="allowMethodSwitch">
                <Label class="mb-1 block">Method</Label>
                <Select v-model="method">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="md:col-span-2">
                <Label class="mb-1 block">Base URL</Label>
                <div class="flex gap-2">
                  <Input v-model="envBaseUrl" placeholder="https://api.example.com" class="font-mono" />
                  <Select v-if="baseUrls.length" @update:modelValue="envBaseUrl = $event">
                    <SelectTrigger class="w-40"><SelectValue placeholder="Environment" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="url in baseUrls" :key="url" :value="url">{{ url }}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label class="mb-1 block">Path</Label>
              <Input v-model="livePath" class="font-mono" />
            </div>

            <!-- Params Editors -->
            <Tabs default-value="path">
              <TabsList class="grid w-full grid-cols-4">
                <TabsTrigger value="path">Path Params</TabsTrigger>
                <TabsTrigger value="query">Query</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
                <TabsTrigger value="auth">Auth</TabsTrigger>
              </TabsList>

              <!-- PATH: keys non-editable, values editable -->
              <TabsContent value="path" class="mt-3">
                <div class="space-y-2">
                  <div v-for="(v,k) in pathParams" :key="k" class="grid grid-cols-5 gap-2">
                    <Input :value="k" disabled class="col-span-2 font-mono" />
                    <Input v-model="pathParams[k]" class="col-span-3 font-mono" />
                    <div class="col-span-5">
                      <Button variant="secondary" size="sm" @click="removeKv('path', k)">Remove</Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" @click="addKv('path')">Add</Button>
                </div>
              </TabsContent>

              <!-- QUERY: key editable via renameKv -->
              <TabsContent value="query" class="mt-3">
                <div class="space-y-2">
                  <div v-for="(v,k) in queryParams" :key="k" class="grid grid-cols-5 gap-2">
                    <Input
                      :value="k"
                      class="col-span-2 font-mono"
                      placeholder="key"
                      @input="renameKv('query', k, ($event.target as HTMLInputElement).value)"
                    />
                    <Input v-model="queryParams[k]" class="col-span-3 font-mono" placeholder="value" />
                    <div class="col-span-5">
                      <Button variant="secondary" size="sm" @click="removeKv('query', k)">Remove</Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" @click="addKv('query')">Add</Button>
                </div>
              </TabsContent>

              <!-- HEADERS: key editable via renameKv -->
              <TabsContent value="headers" class="mt-3">
                <div class="space-y-2">
                  <div v-for="(v,k) in headers" :key="k" class="grid grid-cols-5 gap-2">
                    <Input
                      :value="k"
                      class="col-span-2 font-mono"
                      placeholder="Header"
                      @input="renameKv('headers', k, ($event.target as HTMLInputElement).value)"
                    />
                    <Input v-model="headers[k]" class="col-span-3 font-mono" placeholder="Value" />
                    <div class="col-span-5">
                      <Button variant="secondary" size="sm" @click="removeKv('headers', k)">Remove</Button>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" @click="addKv('headers')">Add</Button>
                </div>
              </TabsContent>

              <TabsContent value="auth" class="mt-3">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label class="mb-1 block">Type</Label>
                    <Select v-model="auth.type">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="bearer">Bearer</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div v-if="auth.type==='bearer'" class="md:col-span-2">
                    <Label class="mb-1 block">Token</Label>
                    <Input v-model="auth.token" placeholder="eyJhbGciOi..." />
                  </div>
                  <template v-if="auth.type==='basic'">
                    <div>
                      <Label class="mb-1 block">Username</Label>
                      <Input v-model="auth.username" />
                    </div>
                    <div>
                      <Label class="mb-1 block">Password</Label>
                      <Input type="password" v-model="auth.password" />
                    </div>
                  </template>
                </div>
              </TabsContent>
            </Tabs>

            <!-- Body -->
            <div v-if="!['GET','DELETE'].includes(method)">
              <Label class="mb-1 block">Body</Label>
              <Textarea v-model="bodyRaw" rows="8" class="font-mono" placeholder='{}' />
              <p class="mt-1 text-xs text-muted-foreground">
                TIP: Body is parsed as JSON when <code>Content-Type: application/json</code>.
              </p>
            </div>

            <div class="rounded-lg border bg-muted/30 px-3 py-2 text-xs font-mono">
              <div class="flex items-center justify-between gap-2">
                <span class="opacity-80">Request URL</span>
                <Button variant="ghost" size="sm" @click="copyToClipboard(buildUrl())">Copy</Button>
              </div>
              <div class="mt-1 overflow-hidden text-ellipsis whitespace-nowrap">{{ buildUrl() }}</div>
            </div>

            <div class="rounded-lg border bg-muted/30">
              <div class="flex items-center justify-between p-2">
                <span class="text-xs opacity-80">cURL</span>
                <Button variant="ghost" size="sm" @click="copyToClipboard(curl)">Copy</Button>
              </div>
              <ScrollArea class="h-36">
                <pre class="px-3 pb-3 text-xs font-mono whitespace-pre-wrap">{{ curl }}</pre>
              </ScrollArea>
            </div>
          </CardContent>
          <CardFooter class="flex justify-end">
            <Button :disabled="sending" @click="sendRequest">
              <span v-if="!sending">Send Request</span>
              <span v-else class="animate-pulse">Sending…</span>
            </Button>
          </CardFooter>
        </Card>

        <!-- Right: Response viewer -->
        <Card class="overflow-hidden">
          <CardHeader class="pb-2">
            <CardTitle class="text-base">Response</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex flex-wrap items-center gap-2 text-sm">
              <Badge v-if="responseStatus !== null" :class="[
                'px-2 py-1',
                responseStatus === -1 ? 'bg-rose-600 text-white'
                : responseStatus >=200 && responseStatus <300 ? 'bg-emerald-600 text-white'
                : responseStatus >=400 ? 'bg-rose-600 text-white'
                : 'bg-amber-600 text-white'
              ]">
                {{ responseStatus === -1 ? 'Network Error' : `HTTP ${responseStatus}` }}
              </Badge>
              <span v-if="responseTimeMs !== null" class="text-muted-foreground">Time: {{ responseTimeMs }} ms</span>
              <Button variant="ghost" size="sm" class="ml-auto" @click="copyToClipboard(responseText)">Copy Body</Button>
            </div>

            <Tabs default-value="body">
              <TabsList class="grid w-full grid-cols-2">
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="headers">Headers</TabsTrigger>
              </TabsList>

              <TabsContent value="body" class="mt-2">
                <ScrollArea class="h-[420px]">
                  <pre class="px-3 py-2 text-xs font-mono whitespace-pre-wrap">{{ responseText }}</pre>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="headers" class="mt-2">
                <ScrollArea class="h-[420px]">
                  <pre class="px-3 py-2 text-xs font-mono whitespace-pre-wrap">{{ tryStringify(responseHeaders) }}</pre>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <DialogFooter class="mt-2">
        <div class="text-xs text-muted-foreground mr-auto">
          Built-in explorer • respects dark mode • keyboard: <kbd class="px-1 rounded bg-muted">Esc</kbd> to close
        </div>
        <Button variant="secondary" @click="open = false">Close</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* subtle polish to match your screenshot feel */
:where(.font-mono){ font-variant-ligatures: none; }
</style>

