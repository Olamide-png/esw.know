// https://nuxt.com/docs/api/configuration/nuxt-config
// /www/nuxt.config.ts
export default defineNuxtConfig({
  devtools: { enabled: true },

  // Inherit everything (including runtimeConfig) from the repo root
  extends: "./.nuxt/tsconfig.json",

  // If you’re using @nuxtjs/i18n via the root config/modules, this merges in cleanly.
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'fr', name: 'Français', language: 'fr-FR' },
    ],
  },

  nitro: {
    rollupConfig: {
      plugins: [
        // ⬇️ Stub app-config only in Nitro server (vercel build)
        process.env.VERCEL && {
          name: 'stub-nuxt-app-config-on-nitro',
          resolveId(id) {
            if (id === '#build/app.config.mjs') return '\0nitro-app-config-stub'
          },
          load(id) {
            if (id === '\0nitro-app-config-stub') {
              // Empty server app-config; safe because server code shouldn't use useAppConfig()
              return 'export default {}'
            }
          }
        }
      ].filter(Boolean)
    }
  },

  // Lock features to a predictable baseline
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















