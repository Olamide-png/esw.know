<!-- components/DocsHeaderLinks.vue -->
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { queryContent } from '#content'

// Props so you can reuse this across repos/branches/content roots
const props = withDefaults(defineProps<{
  repo: string              // e.g. "https://github.com/your-org/your-repo"
  branch?: string           // e.g. "main"
  contentDir?: string       // e.g. "content"
  askAiUrlBase?: string     // optional; defaults to ChatGPT
}>(), {
  branch: 'main',
  contentDir: 'content',
  askAiUrlBase: 'https://chat.openai.com/?q='
})

const route = useRoute()
const { data: page } = await queryContent(route.path).findOne()

// Nuxt Content exposes the on-disk source path on `_file`.
// Fallback builds a path from the route if needed.
const relPath = computed(() => {
  return page.value?._file
    ? page.value._file
    : `${props.contentDir}${route.path.replace(/\/$/, '') || '/index'}.md`
})

const viewUrl = computed(() => `${props.repo}/blob/${props.branch}/${relPath.value}`)
const rawUrl  = computed(() => `${props.repo}/raw/${props.branch}/${relPath.value}`)
const editUrl = computed(() => `${props.repo}/edit/${props.branch}/${relPath.value}`)

const aiPrompt = computed(() =>
  encodeURIComponent(`Help me review this doc: ${route.fullPath}`)
)
const aiUrl = computed(() => `${props.askAiUrlBase}${aiPrompt.value}`)
</script>

<template>
  <div class="flex items-center gap-2">
    <NuxtLink :href="viewUrl" target="_blank" rel="noopener" class="text-sm underline">View</NuxtLink>
    <NuxtLink :href="rawUrl"  target="_blank" rel="noopener" class="text-sm underline">Raw</NuxtLink>
    <NuxtLink :href="editUrl" target="_blank" rel="noopener" class="text-sm underline">Edit</NuxtLink>
    <NuxtLink :href="aiUrl"   target="_blank" rel="noopener" class="text-sm underline">Ask AI</NuxtLink>
  </div>
</template>
