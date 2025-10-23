<script setup lang="ts">
import { onMounted, ref } from 'vue'

const specUrl = '/openapi.bundle.yaml'
const error = ref<string | null>(null)
const loaded = ref(false)

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error(`Failed to load ${src}`))
    document.head.appendChild(s)
  })
}

onMounted(async () => {
  try {
    // 1) Verify the spec is reachable
    const res = await fetch(specUrl, { cache: 'no-store' })
    if (!res.ok) throw new Error(`Spec not found (${res.status}) at ${specUrl}`)

    // 2) Provide Scalar config globally (no inline HTML needed later)
    // See https://github.com/scalar/scalar
    // @ts-ignore
    window.ScalarAPIReference = {
      theme: 'auto',
      layout: 'modern',
      hideClientButton: true,
      spec: { url: specUrl }
    }

    // 3) Load the CDN bundle (registers and renders automatically)
    await loadScript('https://cdn.jsdelivr.net/npm/@scalar/api-reference')

    loaded.value = true
  } catch (e: any) {
    error.value = e?.message || String(e)
  }
})
</script>

<template>
  <ClientOnly>
    <div class="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-neutral-100">
      <div v-if="error" class="mx-auto max-w-3xl p-6">
        <h2 class="text-xl font-semibold mb-2">Scalar failed to load</h2>
        <p class="text-sm opacity-80 mb-4">{{ error }}</p>
        <ul class="list-disc ml-5 space-y-1 text-sm opacity-80">
          <li>Open <a class="underline" href="/openapi.bundle.yaml">/openapi.bundle.yaml</a> — it should download.</li>
          <li>If you use a CSP, allow <code>https://cdn.jsdelivr.net</code> in <code>script-src</code>.</li>
        </ul>
      </div>

      <!-- Scalar renders itself into the body; this container is just for page height -->
      <div v-else-if="!loaded" class="p-6 opacity-70">Loading API Reference…</div>
    </div>
  </ClientOnly>
</template>


