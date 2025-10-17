// /www/nuxt.config.ts
import { defineNuxtConfig } from 'nuxt/config'
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  devtools: { enabled: true },
  compatibilityDate: '2025-05-13',
  css: ['~/assets/css/tailwind.css'],
  vite: { plugins: [tailwindcss()] },
  appConfig: {
    site: { name: 'Knowledge Centre', description: 'ESW Knowledge Centre', url: 'https://esw-know.vercel.app', ogImage: '/Screenshot 2025-07-04 144755.png' },
    shadcnDocs: { site: { name: 'Knowledge Centre', description: 'ESW Knowledge Centre', url: 'https://esw-know.vercel.app', ogImage: '/Screenshot 2025-07-04 144755.png', ogImageComponent: 'ShadcnDocs', ogImageColor: 'light' } }
  },
  app: { head: { link: [
    { rel: 'preconnect', href: 'https://eswapis.vercel.app' },
    { rel: 'dns-prefetch', href: 'https://eswapis.vercel.app' }
  ]}},
  i18n: {
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US' },
      { code: 'fr', name: 'Français', language: 'fr-FR' }
    ]
  }
})













