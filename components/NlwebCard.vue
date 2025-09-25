<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ thing: Record<string, any> }>()
const t = computed(() => props.thing || {})

function first<T=any>(...vals: any[]): T | undefined {
  for (const v of vals) {
    if (v === null || v === undefined) continue
    if (Array.isArray(v)) return (v[0] as T) ?? undefined
    return v as T
  }
}
const type = computed(() => first(t.value['@type'], t.value.type, 'Thing'))
const name = computed(() => first(t.value.name, t.value.headline, t.value.question))
const description = computed(() => first(t.value.description, t.value.abstract, t.value.text))
const url = computed(() => {
  const u = first<any>(t.value.url, t.value.mainEntityOfPage, t.value['@id'])
  if (!u) return undefined
  if (typeof u === 'string') return u
  if (typeof u === 'object') return first(u['@id'], u.url)
  return undefined
})
const image = computed(() => {
  const img = first<any>(t.value.image, t.value.thumbnailUrl, t.value.logo)
  if (!img) return undefined
  if (typeof img === 'string') return img
  if (Array.isArray(img)) return img[0]
  if (typeof img === 'object') return first(img.url, img.contentUrl)
  return undefined
})
</script>

<template>
  <article class="rounded-xl border p-4 shadow-sm bg-background">
    <div class="flex gap-4">
      <img v-if="image" :src="image" alt="" class="h-16 w-16 rounded-lg object-cover border" loading="lazy" />
      <div class="flex-1">
        <div class="text-xs opacity-60">{{ type }}</div>
        <h3 class="text-base font-semibold">
          <a v-if="url" :href="url" target="_blank" rel="noopener">{{ name || url }}</a>
          <span v-else>{{ name || '(untitled)' }}</span>
        </h3>
        <p class="text-sm opacity-80 mt-1 line-clamp-4">{{ description }}</p>
      </div>
    </div>
  </article>
</template>


