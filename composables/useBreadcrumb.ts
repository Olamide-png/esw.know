// composables/useBreadcrumb.ts
interface BreadcrumbItem {
  title: string
  href: string
}

// One function to get navigation on both SSR and CSR without top-level #content imports
async function getNavigation() {
  if (import.meta.server) {
    const mod = await import('#content') as any
    return mod.fetchContentNavigation()
  }
  // Client: use the Nuxt Content endpoint
  return $fetch('/api/_content/navigation')
}

export function useBreadcrumb(url: string): BreadcrumbItem[] {
  // fetch nav once (cached by key)
  const { data: navigation } = useAsyncData('content:navigation', getNavigation)

  const items: BreadcrumbItem[] = []
  const segs = url.split('/').filter(Boolean)

  const nav = navigation.value
  if (!Array.isArray(nav)) return items

  let href = ''
  let cursor: any[] | undefined = nav

  for (const seg of segs) {
    href += `/${seg}`
    const node = cursor?.find(n => n?._path === href)
    items.push({ title: node?.title ?? seg, href })
    cursor = node?.children
  }

  return items
}



