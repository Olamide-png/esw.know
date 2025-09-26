<!-- pages/ask.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

// If you already created components/AskDocsModal.vue earlier,
// this will just work. Otherwise, drop that file in first.
const showAsk = ref(false)
const route = useRoute()

// Optional: open with Cmd/Ctrl+K while on this page
onMounted(() => {
  const handler = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      showAsk.value = true
    }
  }
  window.addEventListener('keydown', handler, { passive: false })
})
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-10 space-y-6">
    <h1 class="text-2xl font-semibold">Ask Docs — Test Page</h1>
    <p class="text-sm opacity-80">
      This page mounts the Ask Docs modal so you can test the flow. Click the button or press
      <kbd class="px-1 py-0.5 rounded bg-neutral-800 text-neutral-100">Cmd/Ctrl + K</kbd>.
    </p>

    <div class="flex gap-3">
      <button
        class="inline-flex items-center gap-2 rounded-xl px-4 py-3 bg-black text-white ring-1 ring-white/10 hover:bg-neutral-900"
        @click="showAsk = true"
      >
        <Icon name="lucide:bot" class="h-4 w-4" />
        Ask Docs
      </button>

      <NuxtLink to="/" class="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-neutral-300/20 hover:bg-neutral-800/30">
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
        Back home
      </NuxtLink>
    </div>

    <div class="rounded-xl border border-neutral-700/50 p-4 text-sm">
      <p class="mb-2">Tips:</p>
      <ul class="list-disc pl-5 space-y-1 opacity-80">
        <li>Clear the <em>Scope</em> field in the modal to search all docs.</li>
        <li>Leave it as <code>{{ route.path }}</code> to bias to this page/section.</li>
        <li>Check your <code>.env</code> has <code>OPENAI_API_KEY</code> and model set.</li>
      </ul>
    </div>
  </div>

  <!-- Mount the modal -->
  <AskDocsModal v-model="showAsk" />
</template>
