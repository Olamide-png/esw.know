<template>
  <div class="px-4 py-6 md:px-8" :class="[config.main.padded && 'container']">
    <ContentRenderer
      v-if="page"
      :key="page._id"
      :value="page"
      :data="(appConfig.shadcnDocs as any)?.data"
    />
    <div v-else class="prose dark:prose-invert max-w-none">
      <h1>404</h1>
      <p>We couldn’t find this page.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const config = useConfig()
const appConfig = useAppConfig()

// Load the current page from @nuxt/content by _path
const { data: page } = await useAsyncData(
  () => `content-page-${route.fullPath}`,
  () => queryContent().where({ _path: route.path }).findOne(),
  { watch: [() => route.fullPath] }
)

// SEO (updates when page changes)
watchEffect(() => {
  const title = page.value?.title ?? '404'
  const desc  = page.value?.description ?? config.value.site.description
  useSeoMeta({
    title: `${title} - ${config.value.site.name}`,
    ogTitle: title,
    description: desc,
    ogDescription: desc,
    ogImage: config.value.site.ogImage,
    twitterCard: 'summary_large_image'
  })
})
</script>

