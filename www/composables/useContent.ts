// www/composables/useContent.ts
import { ref, watchEffect } from 'vue'
import { useRoute } from '#imports'

/**
 * Minimal safe replacement for useContent.
 * It just returns a "page" object derived from the current route.
 * This avoids 500s even if @nuxt/content isn't wired perfectly.
 */
export function useContent() {
  const route = useRoute()

  const page = ref<any>({
    _path: route.path,
    title: '',
    description: '',
  })

  // Update when route changes
  watchEffect(() => {
    const path = route.path || '/'
    const niceTitle =
      path === '/'
        ? 'Home'
        : path
            .replace(/^\//, '')
            .replace(/-/g, ' ')
            .replace(/\//g, ' / ')

    page.value = {
      _path: path,
      title: niceTitle || 'Page',
      description: '',
    }
  })

  return { page }
}

