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
        {
          name: 'trace-app-config-importer',
          resolveId(id, importer) {
            // When the server build tries to pull the Vue app config file,
            // print the importer so we know who is at fault.
            if (id.startsWith('#build/app.config.mjs')) {
              this.warn(`[#build/app.config.mjs] imported by: ${importer}`)
              // Don’t stub yet—let it fail so the log shows up clearly
            }
            return null
          }
        }
      ]
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















