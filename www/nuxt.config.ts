// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  extends: ['..'],
  i18n: {
    defaultLocale: 'en',
    locales: [
      {
        code: 'en',
        name: 'English',
        language: 'en-US',
      },
      {
        code: 'fr',
        name: 'Français',
        language: 'fr-FR',
      },
    ],
  },
  compatibilityDate: '2025-05-13',

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://eswapis.vercel.app' },
        { rel: 'dns-prefetch', href: 'https://eswapis.vercel.app' }
      ]
    }
  }
});

















