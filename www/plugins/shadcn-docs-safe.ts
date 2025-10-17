export default defineNuxtPlugin(() => {
  const app = useAppConfig() as any
  app.shadcnDocs ||= {}
  app.shadcnDocs.site ||= {
    name: 'Site',
    url: '/',
    description: ''
  }
})

