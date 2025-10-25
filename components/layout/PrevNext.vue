<template>
  <div v-if="showPrevNext" class="border-t pt-6 lg:flex lg:flex-row">
    <LayoutPrevNextButton :prev-next="prev" side="left" />
    <span class="flex-1" />
    <LayoutPrevNextButton :prev-next="next" side="right" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { prev, next } = useI18nDocs()

// Get only the current page's front-matter flag (no full doc)
const { data: doc } = await useAsyncData(
  `content-prevNext-${route.fullPath}`,
  () => queryContent().where({ _path: route.path }).only(['prevNext']).findOne(),
  { watch: [() => route.fullPath] }
)

// Default to true when not present, matching your previous behavior
const showPrevNext = computed(() => (doc.value?.prevNext ?? true))
</script>

