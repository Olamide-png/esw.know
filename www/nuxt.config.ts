// /www/nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  // inherit from root
  extends: ['..'],

  // 👇 allow auto-imports from /www/composables and ../composables (repo root)
  imports: {
    dirs: [
      'composables',
      '../composables'
    ]
  },

  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'fr', name: 'Français', language: 'fr-FR' },
    ],
  },

  compatibilityDate: '2025-05-13',

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://eswapis.vercel.app' },
        { rel: 'dns-prefetch', href: 'https://eswapis.vercel.app' },
      ],
    },
  },
})




