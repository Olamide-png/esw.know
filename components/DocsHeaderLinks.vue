<!-- components/DocsHeaderLinks.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = withDefaults(defineProps<{
  repo: string               // e.g. "https://github.com/your-org/your-repo"
  branch?: string            // e.g. "main"
  contentDir?: string        // e.g. "content"
  askAiUrlBase?: string      // e.g. "https://chat.openai.com/?q="
}>(), {
  branch: 'main',
  contentDir: 'content',
  askAiUrlBase: 'https://chat.openai.com/?q='
})

const route = useRoute()

// ✅ relies on your layer's auto-imported composable (no imports needed)
const { page } = useContent()

// Prefer the on-disk path from page; fall back to route path
const relPath = computed(() =>
  page.value?._file
    ? page.value._file
    : `${props.contentDir}${(route.path.replace(/\/$/, '')) || '/index'}.md`
)

const viewUrl = computed(() => `${props.repo}/blob/${props.branch}/${relPath.value}`)
const rawUrl  = computed(() => `${props.repo}/raw/${props.branch}/${relPath.value}`)
const editUrl = computed(() => `${props.repo}/edit/${props.branch}/${relPath.value}`)

const aiPrompt = computed(() => encodeURIComponent(`Help me read this doc so I can understand it better: ${route.fullPath}`))
const aiUrl    = computed(() => `${props.askAiUrlBase}${aiPrompt.value}`)
</script>

<template>
  <div class="flex items-center gap-2">
    <a :href="viewUrl" target="_blank" rel="noopener" class="text-sm underline">View</a>
    <a :href="rawUrl"  target="_blank" rel="noopener" class="text-sm underline">Raw</a>
    <a :href="editUrl" target="_blank" rel="noopener" class="text-sm underline">Edit</a>
    <a :href="aiUrl"   target="_blank" rel="noopener" class="text-sm underline">Ask AI</a>
  </div>
</template>



