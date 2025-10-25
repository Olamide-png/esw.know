// composables/useBreadcrumb.ts
interface BreadcrumbItem { title: string; href: string }

export function useBreadcrumb(url: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = []
  const segments = url.split('/').filter(Boolean)
  let href = ''

  // we need the full nav tree to resolve titles along the path
  const { data: navigation } = useAsyncData('content:navigation', async () => {
    if (import.meta.server) {
      const mod = await import('#content') as any
      return mod.fetchContentNavigation()
    }
    return $fetch('/api/_content/navigation')
  })

  const nav = navigation.value
  if (!Array.isArray(nav)) return []

  // walk the tree by segments and pick titles
  let cursor: any[] | undefined = nav
  for (const seg of segments) {
    href += `/${seg}`
    const node = cursor?.find(n => n?._path === href)
    items.push({ title: node?.title ?? seg, href })
    cursor = node?.children
  }

  return items
}


