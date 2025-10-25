// composables/useEditLink.ts
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export function useEditLink() {
  const route = useRoute()

  // Pull edit-link settings from your app config
  const { enable, pattern, text, icon, placement } = useConfig().value.main.editLink

  // Fetch only what we need for this route (_file + optional front-matter override)
  const { data: page } = useAsyncData(
    () => `content-current-${route.fullPath}`,
    () =>
      queryContent()
        .where({ _path: route.path })
        .only(['_file', 'editLink'])
        .findOne(),
    { watch: [() => route.fullPath] }
  )

  // Build the edit URL by replacing :path with the file path from content
  const url = computed(() => pattern.replace(/:path/g, page.value?._file ?? ''))

  // Whether the edit link is enabled for this page
  const enabled = computed(() => {
    if (!enable) return false
    if (page.value?.editLink === false) return false // front-matter override
    return Boolean(page.value?._file && url.value)
  })

  // Placement flags (same as before)
  const enabledToc = computed(() => enabled.value && placement.includes('toc'))
  const enabledDocsFooter = computed(
    () => enabled.value && placement.includes('docsFooter')
  )

  return {
    url,
    text,
    icon,
    enabledToc,
    enabledDocsFooter
  }
}
