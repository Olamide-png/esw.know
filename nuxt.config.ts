// nuxt.config.ts
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  devtools: { enabled: true },

  // ---- Site metadata (prevents "reading 'site'" 500s) ----
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://esw-know.vercel.app',
    name: 'ESW Knowledge',
    description: 'Docs',
  },

  appConfig: {
    site: {
      url: process.env.NUXT_PUBLIC_SITE_URL || 'https://esw-know.vercel.app',
      name: 'ESW Knowledge',
      description: 'Docs',
    },
  },

  // ✅ Server/runtime env for Try-It proxy (+ public site info)
  runtimeConfig: {
    TRYIT_ALLOWED_HOSTS: process.env.TRYIT_ALLOWED_HOSTS || '',
    public: {
      TRYIT_LABELS: process.env.TRYIT_LABELS || '',
      TRYIT_BASEURLS: process.env.TRYIT_BASEURLS || '',
      site: {
        url: process.env.NUXT_PUBLIC_SITE_URL || 'https://esw-know.vercel.app',
        name: 'ESW Knowledge',
        description: 'Docs',
      },
    },
  },

  // ✅ Make sure /api/tryit isn't cached and (optionally) allows CORS
  nitro: {
    routeRules: {
      '/api/tryit': { cors: true, headers: { 'Cache-Control': 'no-store' } },
    },
  },

  modules: [
    'shadcn-nuxt',
    '@vueuse/nuxt',
    '@ztl-uwu/nuxt-content',
    '@nuxt/image',
    '@nuxt/icon',
    '@nuxtjs/color-mode',
    'nuxt-og-image',
    '@nuxt/scripts',
    '@nuxtjs/i18n',
    '@nuxt/fonts',
  ],

  shadcn: {
    prefix: 'Ui',
    componentDir: join(currentDir, './components/ui'),
  },

  components: {
    dirs: [
      // 1) UI (shadcn) — import as <UiButton/>, <UiAccordion/>, etc.
      {
        path: './components/ui',
        extensions: ['vue'],
        prefix: 'Ui',
        pathPrefix: false, // don’t include folder in the tag (keeps <UiButton/>)
      },

      // 2) Content components — import as <CntAccordion/>, <CntTabs/>, etc.
      {
        path: './components/content',
        extensions: ['vue'],
        prefix: 'Cnt',
        pathPrefix: false,
      },

      // 3) App components (root) — no prefix
      {
        path: './components',
        extensions: ['vue'],
        pathPrefix: false,
        // do NOT auto-import subfolders we’ve already defined above
        ignore: ['ui/**', 'content/**', '**/*.ts', '**/*.tsx'],
      },
    ],
  },

  i18n: {
    bundle: { optimizeTranslationDirective: false },
    strategy: 'prefix_except_default',
  },

  colorMode: {
    preference: 'light',
    fallback: 'light',
    detectBrowserColorScheme: false,
    classSuffix: '',
    disableTransition: true,
  },

  css: [join(currentDir, './assets/css/themes.css'), '~/assets/css/tailwind.css'],

  content: {
    documentDriven: true,
    highlight: {
      theme: { default: 'light-plus', dark: 'dracula' },
      preload: [
        'json','js','ts','html','css','vue','diff','shell','markdown','mdc','yaml','bash','ini','dotenv','python','xml','dockerfile','sql','graphql','csharp','java','php','ruby','go','rust','kotlin','swift'
      ],
    },
    navigation: {
      fields: [
        'icon','navBadges','navTruncate','badges','toc','sidebar','collapse','editLink','prevNext','breadcrumb','fullpage',
      ],
    },
    experimental: { search: { indexed: true } },
  },

  icon: { clientBundle: { scan: true, sizeLimitKb: 512 } },

  fonts: { defaults: { weights: ['300 800'] } },

  typescript: { tsConfig: { compilerOptions: { baseUrl: '.' } } },

  vite: { plugins: [tailwindcss()] },

  compatibilityDate: '2025-05-13',

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://eswapis.vercel.app' },
        { rel: 'dns-prefetch', href: 'https://eswapis.vercel.app' },
      ],
    },
  },
});








