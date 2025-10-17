// /www/nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  devtools: { enabled: true },

  // ❌ Do not inherit from the repo root; it caused prepare/build issues
  // extends: ['..'],

  // Lock features to a predictable baseline
  compatibilityDate: '2025-05-13',

  // Global CSS (ensure the files exist under /www)
  css: [
    '~/assets/css/tailwind.css',
    // '~/assets/css/themes.css', // comment out if you don't use it
  ],

  // Vite plugins
  vite: { plugins: [tailwindcss()] },

  // Head tags
  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://eswapis.vercel.app' },
        { rel: 'dns-prefetch', href: 'https://eswapis.vercel.app' }
      ]
    }
  },

  // i18n options (works whether @nuxtjs/i18n is added here or via modules)
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'fr', name: 'Français', language: 'fr-FR' }
    ]
  },

  // Put “site” under appConfig so `useAppConfig()` can read it
  appConfig: {
    site: {
      name: 'Knowledge Centre',
      description: 'ESW Knowledge Centre',
      url: 'https://esw-know.vercel.app',
      ogImage: '/Screenshot 2025-07-04 144755.png'
    },
    // shadcn-docs expects this shape:
    shadcnDocs: {
      site: {
        name: 'Knowledge Centre',
        description: 'ESW Knowledge Centre',
        url: 'https://esw-know.vercel.app',
        ogImage: '/Screenshot 2025-07-04 144755.png',
        ogImageComponent: 'ShadcnDocs',
        ogImageColor: 'light'
      }
    }
  }
})











