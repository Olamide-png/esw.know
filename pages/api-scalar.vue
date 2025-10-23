<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useHead } from '#imports'

const specUrl = '/openapi.bundle.yaml'
const error = ref<string | null>(null)
const loading = ref(true)

useHead({
  link: [{ rel: 'preconnect', href: 'https://cdn.jsdelivr.net' }]
})

async function loadScalarModule() {
  // Load the ESM bundle at runtime (note the vite-ignore comment)
  await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@scalar/api-reference')
}

onMounted(async () => {
  try {
    // 1) Verify the spec is reachable
    const res = await fetch(specUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Spec not found (${res.status}) at ${specUrl}`)

    // 2) Load Scalar as an ES module
    await loadScalarModule()

    // 3) Wait for the custom element to be defined
    await customElements.whenDefined('api-reference')

    // 4) Create + mount the element
    const container = document.getElementById('scalar-container')
    if (!container) throw new Error('Missing #scalar-container')
    const el = document.createElement('api-reference') as HTMLElement
    el.setAttribute('spec-url', specUrl)
    el.setAttribute('layout', 'modern')
    el.setAttribute('theme', 'auto')
    el.setAttribute('hide-client-button', '') // remove to show "Generate Client"
    container.appendChild(el)

    loading.value = false
  } catch (e: any) {
    error.value = e?.message || String(e)
    loading.value = false
  }
})
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-neutral-100">
      <div class="max-w-6xl mx-auto p-6">
        <div v-if="error" class="rounded-md border border-red-500/40 bg-red-500/10 p-4">
          <p class="font-semibold mb-1">Scalar failed to load</p>
          <p class="text-sm opacity-80 mb-3">{{ error }}</p>
          <ul class="list-disc ml-5 text-sm opacity-80 space-y-1">
            <li>Open <a class="underline" href="/openapi.bundle.yaml">/openapi.bundle.yaml</a> — it should download.</li>
            <li>If you use a CSP, allow <code>https://cdn.jsdelivr.net</code> in <code>script-src</code> (module imports).</li>
          </ul>
        </div>

        <div v-else>
          <div v-if="loading" class="opacity-70">Loading API Reference…</div>
          <div id="scalar-container"></div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>




