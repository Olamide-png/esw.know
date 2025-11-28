// www/composables/useContent.ts
import { computed } from 'vue'
import { useRoute, useAsyncData, queryContent } from '#imports'

/**
 * Minimal drop-in replacement for the shadcn-docs "useContent" helper.
 * It loads the current page document from @nuxt/content using the route path.
 */
export function useContent() {
  const route = useRoute()

  // Adjust this mapping if your content paths are different.
  const slug = computed(() => {
    // e.g. "/" -> "/" (or "/index" if your docs live there)
    return route.path === '/' ? '/' : route.path
  })

  const { data: page } = useAsyncData(
    `content:${slug.value}`,
    () => queryContent(slug.value).findOne()
  )

  return { page }
}
