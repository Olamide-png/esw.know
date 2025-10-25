// composables/useBreadcrumb.ts
interface BreadcrumbItem {
  title: string
  href: string
}

/** Get navigation without any top-level #content imports */
async function getNavigation() {
  // Server: dynamically import to keep it out of the client bundle
  if (import.meta.server) {
    const mod = (await import('#content')) as any
    return mod.fetchContentNavigation()
  }
  // Client: call the built-in Nuxt Content API
  return $fetch('/api/_content/navigation')
}

export function useBreadcrumb(url: string): BreadcrumbItem[] {
  // Cached once by key
  const { data: navigation } = useAsyncData('content:navigation', getNavigation)

  const items: BreadcrumbItem[] = []
  const segments = url.split('/').filter(Boolean)

  const nav = navigation.value
  if (!Array.isArray(nav)) return items

  let href = ''
  let cursor: any[] | undefined = nav

  for (const seg of segments) {
    href += `/${seg}`
    const node = cursor?.find(n => n?._path === href)
    items.push({ title: node?.title ?? seg, href })
    cursor = node?.children
  }

  return items
}




