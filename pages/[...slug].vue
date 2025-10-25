<script setup lang="ts">
import { watchEffect } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const config = useConfig()
const appConfig = useAppConfig()

// Load current page by _path from @nuxt/content
const { data: page } = await useAsyncData(
  () => `content-page-${route.fullPath}`,
  () => queryContent().where({ _path: route.path }).findOne(),
  { watch: [() => route.fullPath] }
)

// SEO: react to page changes
watchEffect(() => {
  const title = page.value?.title ?? '404'
  const desc  = page.value?.description ?? config.value.site.description
  useSeoMeta({
    title: `${title} - ${config.value.site.name}`,
    ogTitle: title,
    description: desc,
    ogDescription: desc,
    twitterCard: 'summary_large_image'
  })
})

// OG Image (safe to run reactively)
watchEffect(() => {
  defineOgImageComponent(config.value.site.ogImageComponent, {
    title: page.value?.title,
    description: page.value?.description
  })
})
</script>
