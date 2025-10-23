<script setup lang="ts">
import { onMounted, ref } from 'vue'
const specUrl = '/openapi.bundle.yaml'
const ready = ref(false)
const error = ref<string | null>(null)

function load(hrefOrSrc: string, type: 'css' | 'js') {
  return new Promise<void>((resolve, reject) => {
    const el = type === 'css'
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
    const res = await fetch(specUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Spec not found (${res.status}) at ${specUrl}`)

    await load('https://unpkg.com/@stoplight/elements/styles.min.css', 'css')
    await load('https://unpkg.com/@stoplight/elements/web-components.min.js', 'js')
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
        <h2 class="text-xl font-semibold mb-2">API Reference failed to load</h2>
        <p class="text-sm opacity-80 mb-4">{{ error }}</p>
        <ul class="list-disc ml-5 text-sm opacity-80">
          <li>Open <a class="underline" href="/openapi.bundle.yaml">/openapi.bundle.yaml</a> directly — it should download.</li>
          <li>If you use a CSP, allow <code>https://unpkg.com</code> in <code>script-src</code> and <code>style-src</code>.</li>
        </ul>
      </div>

      <!-- Auto-upgrades once the web component script loads -->
      <elements-api
        v-if="ready"
        apiDescriptionUrl="/openapi.bundle.yaml"
        router="hash"
        hideTryItPanel
        layout="sidebar"
      />
    </div>
  </ClientOnly>
</template>
