<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '#imports'

const specUrl = '/openapi.bundle.yaml'
const error = ref<string | null>(null)

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Redoc script'))
    document.head.appendChild(s)
  })
}

onMounted(async () => {
  try {
    // quick check: is the spec reachable?
    const res = await fetch(specUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Spec not found (${res.status}) at ${specUrl}`)

    // load the CDN bundle if not already present
    // @ts-ignore
    if (!window.Redoc) {
      await loadScript('https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js')
    }
    // @ts-ignore
    const Redoc = window.Redoc
    if (!Redoc) throw new Error('Redoc global not available')

    Redoc.init(
      specUrl,
      { hideDownloadButton: true, suppressWarnings: true },
      document.getElementById('redoc-container')!
    )
  } catch (e: any) {
    error.value = e?.message || String(e)
  }
})

useHead({
  link: [{ rel: 'preconnect', href: 'https://cdn.redoc.ly' }]
})
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-neutral-100">
      <div v-if="error" class="mx-auto max-w-3xl p-6">
        <h2 class="text-xl font-semibold mb-2">API Docs failed to load</h2>
        <p class="text-sm opacity-80 mb-4">{{ error }}</p>
        <ul class="list-disc ml-5 space-y-1 text-sm opacity-80">
          <li>Ensure <code>public/openapi.bundle.yaml</code> is committed and deployed.</li>
          <li>Open <a class="underline" href="/openapi.bundle.yaml">/openapi.bundle.yaml</a> — it should download.</li>
          <li>If you use a CSP, allow <code>https://cdn.redoc.ly</code> in <code>script-src</code>.</li>
        </ul>
      </div>
      <div id="redoc-container"></div>
    </div>
  </ClientOnly>
</template>


