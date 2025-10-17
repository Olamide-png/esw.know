// /www/plugins/site-fallback.ts
export default defineNuxtPlugin(() => {
  const app = useAppConfig()
  // Don’t mutate app config; provide a safe getter instead.
  const site =
    app?.shadcnDocs?.site ??
    app?.site ??
    { name: 'Site', description: '', url: '' }

  // Injectable helper so components can use useNuxtApp().$site
  return {
    provide: { site }
  }
})
