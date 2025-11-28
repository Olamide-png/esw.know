<template>
  <div
    class="px-4 py-6 md:px-8"
    :class="[config.main.padded && 'container']"
  >
    <ContentRenderer
      :key="page._id"
      :value="page"
      :data="(appConfig.shadcnDocs as any)?.data"
    />
  </div>
</template>

<script setup lang="ts">
import { useContent } from '#imports'  // ✅ make it explicit

const { page } = useContent();
const { config } = useConfigs();
const appConfig = useAppConfig();

useSeoMeta({
  title: `${page.value?.title ?? '404'} - ${config.value.site.name}`,
  description: page.value?.description,
  ogTitle: page.value?.title,
  ogDescription: page.value?.description,
  ogImage: config.value.site.ogImage,
  twitterCard: 'summary_large_image',
});
</script>


