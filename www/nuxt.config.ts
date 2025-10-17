// https://nuxt.com/docs/api/configuration/nuxt-config
// /www/nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Inherit everything (including runtimeConfig) from the repo root
  extends: ['..'],

  // If you’re using @nuxtjs/i18n via the root config/modules, this merges in cleanly.
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'fr', name: 'Français', language: 'fr-FR' },
    ],
  },

  // Lock features to a predictable baseline
  compatibilityDate: '2025-05-13',

  site: {
      name: 'Knowledge Centre',
      description: 'ESW Knowledge Centre',
      ogImage: '/Screenshot 2025-07-04 144755.png',
      ogImageComponent: 'ShadcnDocs',
      ogImageColor: 'light',
  },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://eswapis.vercel.app' },
        { rel: 'dns-prefetch', href: 'https://eswapis.vercel.app' },
      ],
    },
  },
})










