<script setup lang="ts">
import StepCodeGroupWalkthrough from '~/components/StepCodeGroupWalkthrough.vue'
import WorkbenchDrawer from '~/components/WorkbenchDrawer.vue'

const wbOpen = ref(false)

// ——— your existing walkthrough data ———
const steps = [
  { id: 1, title: 'Install SDKs', body: 'Install server + client SDK.' },
  { id: 2, title: 'Create Checkout Session (server)', body: 'Return the session ID.' },
  { id: 3, title: 'Redirect to Checkout (client)', body: 'Use redirectToCheckout.' },
  { id: 4, title: 'Handle Webhook', body: 'Verify signature and fulfill.' }
]
const codeJS = `// ... (your sample code from earlier, with markers) `
const codeTS = codeJS
const codePY = `# ... python sample`
const blocks = [
  { key: 'js', label: 'JavaScript', language: 'js', code: codeJS },
  { key: 'ts', label: 'TypeScript', language: 'ts', code: codeTS },
  { key: 'py', label: 'Python', language: 'py', code: codePY },
]

// ——— mock Customs Catalog API spec for API Explorer (replace with real later) ———
const customsSpec = {
  baseUrl: 'https://httpbin.org', // swap to your dev gateway base
  paths: {
    '/customs/items': {
      GET: {
        summary: 'List customs items',
        description: 'Returns a list with basic filters.',
        params: { query: { limit: 'number', offset: 'number', hsCode: 'string' } },
        headers: { 'X-Env': 'dev' }
      },
      POST: {
        summary: 'Create customs item',
        headers: { 'X-Env': 'dev' },
        body: {
          sku: 'SKU-123',
          hsCode: '9999.99.99',
          countryOfOrigin: 'IE',
          description: 'Wool scarf'
        }
      }
    },
    '/customs/items/{id}': {
      GET: {
        summary: 'Get customs item by ID',
        params: { path: { id: 'string' } }
      },
      PUT: {
        summary: 'Update customs item',
        params: { path: { id: 'string' } },
        headers: { 'X-Env': 'dev' },
        body: { description: 'Updated description' }
      },
      DELETE: {
        summary: 'Delete customs item',
        params: { path: { id: 'string' } }
      }
    }
  }
}
</script>

<template>
  <div class="mx-auto max-w-6xl p-6 space-y-4">
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-2xl font-bold">Tabbed Step ⇄ Code Walkthrough</h1>
        <p class="text-neutral-600 dark:text-neutral-400">
          Click a step to highlight the matching lines. Switch tabs to see the same steps in different languages.
        </p>
      </div>

      <!-- Open Workbench -->
      <button
        class="rounded-lg border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-900
               border-neutral-200 dark:border-neutral-800"
        title="Open Workbench (Ctrl+`)"
        @click="wbOpen = true"
      >
        Open Workbench
      </button>
    </div>

    <StepCodeGroupWalkthrough
      :steps="steps"
      :blocks="blocks"
      :parse-markers="true"
      :initial-step="0"
      :initial-block="0"
    />

    <!-- floating fab (optional) -->
    <button
      class="fixed bottom-4 right-4 z-[62] rounded-full px-4 py-3 text-sm shadow-lg
             border border-neutral-200 dark:border-neutral-800
             bg-white/90 dark:bg-neutral-950/90 backdrop-blur hover:bg-white dark:hover:bg-neutral-900"
      title="Open Workbench (Ctrl+`)"
      @click="wbOpen = true"
    >
      Workbench
    </button>

    <!-- Drawer -->
    <WorkbenchDrawer v-model:open="wbOpen" :spec="customsSpec" />
  </div>
</template>
