// /www/plugins/shadcn-docs-safe.ts
export default defineNuxtPlugin(() => {
  const app = useAppConfig()
  app.shadcnDocs ||= {} as any
  app.shadcnDocs.site ||= {
    name: 'Site',
    url: '/',
    description: ''
  }
})
