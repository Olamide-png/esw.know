import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const currentDir = dirname(fileURLToPath(import.meta.url));

export default defineNuxtConfig({
  devtools: { enabled: true },
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
      {
        path: './components',
        ignore: ['**/*.ts'],
      },
    ],
  },
  i18n: {
    bundle: {
      optimizeTranslationDirective: false,
    },
    strategy: 'prefix_except_default',
  },
  colorMode: {
    classSuffix: '',
    disableTransition: true,
  },
  css: [
    join(currentDir, './assets/css/themes.css'),
    '~/assets/css/tailwind.css',
  ],
  content: {
    documentDriven: true,
    highlight: {
      theme: {
        default: 'light-plus',
        dark: 'dracula',
      },
      preload: ['json', 'js', 'ts', 'html', 'css', 'vue', 'diff', 'shell', 'markdown', 'mdc', 'yaml', 'bash', 'ini', 'dotenv', 'python', 'xml', 'dockerfile', 'sql', 'graphql', 'csharp', 'java', 'php', 'ruby', 'go', 'rust', 'kotlin', 'swift'],
    },
    navigation: {
      fields: [
        'icon',
        'navBadges',
        'navTruncate',
        'badges',
        'toc',
        'sidebar',
        'collapse',
        'editLink',
        'prevNext',
        'breadcrumb',
        'fullpage',
      ],
    },
    experimental: {
      search: {
        indexed: true,
      },
    },
  },
  icon: {
    clientBundle: {
      scan: true,
      sizeLimitKb: 512,
    },
  },
  fonts: {
    defaults: {
      weights: ['300 800'],
    },
  },
  typescript: {
    tsConfig: {
      compilerOptions: {
        baseUrl: '.',
      },
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
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
