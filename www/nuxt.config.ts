// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  extends: ['..'],

  modules: ['@nuxt/content'],

  content: {
    markdoc: {
      config: './markdoc.config.js',
      components: {
        Row: '~/components/Row.vue',
        Col: '~/components/Col.vue',
        CodeGroup: '~/components/CodeGroup.vue',
        Property: '~/components/Property.vue',
        Properties: '~/components/Properties.vue',
      },
    },
  },

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
});

