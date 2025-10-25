// composables/useBreadcrumb.ts
import { ref } from 'vue'

interface BreadcrumbItem {
  title: string
  href: string
}

/** Fetch navigation without importing `#content` */
async function getNavigation() {
  // Works in both SSR and CSR
  return await $fetch<any[]>('/api/_content/navigation')
}

export function useBreadcrumb(url: string) {
  const items = ref<BreadcrumbItem[]>([])

  useAsyncData(
    // unique key per URL
    () => `breadcrumb:${url}`,
    async () => {
      const nav = await getNavigation()
      if (!Array.isArray(nav)) return []

      const segments = url.split('/').filter(Boolean)
      const out: BreadcrumbItem[] = []
      let href = ''
      let cursor: any[] | undefined = nav

      for (const seg of segments) {
        href += `/${seg}`
        const node = cursor?.find(n => n?._path === href)
        out.push({ title: node?.title ?? seg, href })
        cursor = node?.children
      }

      return out
    }
  ).then(({ data }) => {
    items.value = data.value || []
  })

  return items
}





