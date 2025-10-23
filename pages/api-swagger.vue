<script setup lang="ts">
import { onMounted, ref } from 'vue'

const specUrl = '/openapi.bundle.yaml'
const error = ref<string | null>(null)
const ready = ref(false)

function load(hrefOrSrc: string, type: 'css' | 'js') {
  return new Promise<void>((resolve, reject) => {
    const el =
      type === 'css'
        ? Object.assign(document.createElement('link'), { rel: 'stylesheet', href: hrefOrSrc })
        : Object.assign(document.createElement('script'), { src: hrefOrSrc, async: true })
    el.onload = () => resolve()
    // @ts-ignore
    el.onerror = () => reject(new Error(`Failed to load ${hrefOrSrc}`))
    document.head.appendChild(el)
  })
}

onMounted(async () => {
  try {
    // 1) Verify the spec is reachable
    const res = await fetch(specUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Spec not found (${res.status}) at ${specUrl}`)

    // 2) Load Swagger UI (CSS + JS) from CDN
    await load('https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css', 'css')
    await load('https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js', 'js')

    // 3) Init the UI
    // @ts-ignore
    const SwaggerUIBundle = window.SwaggerUIBundle
    if (!SwaggerUIBundle) throw new Error('SwaggerUIBundle not available (CDN blocked?)')

    // Optional: default Bearer header (uncomment & set token)
    // const requestInterceptor = (req: any) => {
    //   req.headers = req.headers || {}
    //   req.headers['Authorization'] = 'Bearer YOUR_TOKEN'
    //   return req
    // }

    SwaggerUIBundle({
      url: specUrl,
      dom_id: '#swagger',
      deepLinking: true,
      docExpansion: 'list',     // 'none' | 'list' | 'full'
      tryItOutEnabled: true,
      // requestInterceptor,
      presets: [SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout'
    })

    ready.value = true
  } catch (e: any) {
    error.value = e?.message || String(e)
  }
})
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-neutral-100">
      <div v-if="error" class="mx-auto max-w-3xl p-6">
        <h2 class="text-xl font-semibold mb-2">Swagger UI failed to load</h2>
        <p class="text-sm opacity-80 mb-4">{{ error }}</p>
        <ul class="list-disc ml-5 space-y-1 text-sm opacity-80">
          <li>Open <a class="underline" href="/openapi.bundle.yaml">/openapi.bundle.yaml</a> — it should download.</li>
          <li>If you use a CSP, allow <code>https://cdn.jsdelivr.net</code> in <code>script-src</code> and <code>style-src</code>.</li>
        </ul>
      </div>

      <div v-else class="p-0">
        <div v-if="!ready" class="p-6 opacity-70">Loading API Reference…</div>
        <div id="swagger" class="swagger-root"></div>
      </div>
    </div>
  </ClientOnly>
</template>

<style>
/* Simple dark-mode tweaks */
.dark .swagger-ui,
.dark .swagger-ui .info { color: #e5e7eb; }
.dark .swagger-ui .topbar { background: transparent; border-bottom: 1px solid rgba(255,255,255,0.08); }
.dark .swagger-ui .opblock { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.12); }
.dark .swagger-ui .scheme-container { background: rgba(255,255,255,0.02); border-color: rgba(255,255,255,0.12); }
.dark .swagger-ui .model-box,
.dark .swagger-ui .model-title { color: #e5e7eb; }
</style>

