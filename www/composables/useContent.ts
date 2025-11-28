// www/composables/useContent.ts
import { computed } from 'vue'
import { useRoute } from '#imports'

/**
 * Super-safe stub for useContent.
 * It just returns a "page" object derived from the current route,
 * so anything calling `const { page } = useContent()` will work.
 */
export function useContent() {
  const route = useRoute()

  const page = computed(() => {
    const path = route.path || '/'
    const niceTitle =
      path === '/'
        ? 'Home'
        : path
            .replace(/^\//, '')
            .replace(/-/g, ' ')
            .replace(/\//g, ' / ')

    return {
      _path: path,
      title: niceTitle || 'Page',
      description: '',
    }
  })

  return { page }
}
