<script setup lang="ts">
import { ref, computed } from 'vue'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import KeyValueEditor from '@/components/tryit/KeyValueEditor.vue'
import JsonEditor from '@/components/tryit/JsonEditor.vue'

const props = withDefaults(defineProps<{
  title?: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
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

const { toast } = useToast()

// state
const envIdx = ref(0)
const urlPreview = computed(() => `${props.environments[envIdx.value]?.baseUrl?.replace(/\/$/, '')}${props.path}`)
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

function computeURL() {
  const base = props.environments[envIdx.value]?.baseUrl?.replace(/\/$/, '') || ''
  const q = query.value
    .filter(r => r.enabled && r.key)
    .map(r => `${encodeURIComponent(r.key)}=${encodeURIComponent(r.value ?? '')}`)
    .join('&')
  return q ? `${base}${props.path}?${q}` : `${base}${props.path}`
}

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

    // prepare headers
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
    ;(toast as any)({ title: 'Request failed', description: String(respBody.value) })
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
  <Card class="w-full">
    <CardHeader class="gap-2">
      <div class="flex flex-wrap items-center gap-2">
        <Badge :variant="status === 0 ? 'destructive' : 'secondary'" class="uppercase tracking-wide">{{ method }}</Badge>
        <CardTitle class="truncate">{{ title || path }}</CardTitle>
      </div>

      <div class="flex flex-wrap items-center gap-2 mt-2">
        <Select v-model="envIdx">
          <SelectTrigger class="w-[320px]">
            <SelectValue placeholder="Environment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="(env,i) in environments" :key="i" :value="i">
              {{ env.label }} — {{ env.baseUrl }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Input :value="urlPreview" readonly class="flex-1 font-mono" />
        <Button :disabled="sending" @click="send">{{ sending ? 'Sending…' : 'Send' }}</Button>
      </div>

      <div class="flex flex-wrap gap-3 text-sm text-muted-foreground mt-1">
        <span>cURL preview: <code class="font-mono break-all">{{ curl }}</code></span>
      </div>
    </CardHeader>

    <CardContent>
      <Tabs default-value="body" class="w-full">
        <TabsList>
          <TabsTrigger value="body">Body</TabsTrigger>
          <TabsTrigger value="query">Query</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          <TabsTrigger value="cookies">Auth</TabsTrigger>
        </TabsList>

        <!-- Body Tab -->
        <TabsContent value="body" class="mt-4">
          <div v-if="['POST','PUT','PATCH'].includes(method)" class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <label class="text-sm">Content-Type</label>
              <Select v-model="selectedContentType">
                <SelectTrigger class="w-[320px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="ct in contentTypes" :key="ct" :value="ct">{{ ct }}</SelectItem>
                </SelectContent>
              </Select>

              <div v-if="exampleLabels.length" class="flex items-center gap-2">
                <span class="text-sm">Pick an example</span>
                <Select @update:modelValue="loadExample">
                  <SelectTrigger class="w-[260px]">
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="lbl in exampleLabels" :key="lbl" :value="lbl">{{ lbl }}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <JsonEditor v-model="body" />
          </div>
          <div v-else class="text-sm text-muted-foreground">No body for {{ method }}.</div>
        </TabsContent>

        <!-- Query Tab -->
        <TabsContent value="query" class="mt-4">
          <KeyValueEditor v-model:rows="query" add-label="Add query" />
        </TabsContent>

        <!-- Headers Tab -->
        <TabsContent value="headers" class="mt-4">
          <KeyValueEditor v-model:rows="headers" add-label="Add header" />
        </TabsContent>

        <!-- Auth Tab -->
        <TabsContent value="cookies" class="mt-4">
          <div v-if="auth==='bearer'" class="space-y-2">
            <label class="text-sm">Bearer token</label>
            <Input v-model="bearer" type="password" placeholder="Paste token…" />
          </div>
          <div v-else-if="auth==='apikey'" class="space-y-2">
            <label class="text-sm">API key ({{ apikeyHeader }})</label>
            <Input v-model="apikey" type="password" placeholder="Paste key…" />
          </div>
          <div v-else class="text-sm text-muted-foreground">No auth required.</div>
        </TabsContent>
      </Tabs>

      <!-- Response panel -->
      <div class="mt-6 rounded-lg border p-4">
        <div class="flex flex-wrap items-center gap-3">
          <Badge v-if="status!==null" :variant="status>=200 && status<300 ? 'default' : 'secondary'">Status: {{ status }}</Badge>
          <Badge>Time: {{ timeMs ?? '—' }} ms</Badge>
          <Badge>Size: {{ bytesFmt(sizeBytes) }}</Badge>
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
      </div>
    </CardContent>
  </Card>
</template>
