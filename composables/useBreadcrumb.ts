// composables/useBreadcrumb.ts
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { fetchContentNavigation } from '#content'

export interface BreadcrumbItem {
  title: string
  href: string
}

export function useBreadcrumb(url?: string) {
  const route = useRoute()
  const targetUrl = url || route.path

  // Load the navigation tree (cached by useAsyncData)
  const { data: navigation } = useAsyncData(
    'content:navigation',
    () => fetchContentNavigation()
  )

  const items = computed<BreadcrumbItem[]>(() => {
    const nav = navigation.value
    if (!nav || !targetUrl) return []

    // Normalize: split and drop empty segments
    const segments = String(targetUrl)
      .split('/')
      .filter(Boolean)
      .map(s => s.replace('.html', ''))

    const crumbs: BreadcrumbItem[] = []
    let href = ''
    // We’ll descend the tree level by level like your original logic
    let currentLevel: any[] | undefined = nav

    for (const seg of segments) {
      href += `/${seg}`
      const page = currentLevel?.find((n: any) => n?._path === href)
      crumbs.push({ title: page?.title ?? seg, href })
      currentLevel = page?.children
    }

    return crumbs
  })

  return items
}
