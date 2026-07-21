import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const libRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const libEntry = resolve(libRoot, 'src/index.ts')

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  app: {
    head: {
      title: 'web-have-sounds',
      meta: [
        {
          name: 'description',
          content:
            'Docs and playground for @thenormvg/web-have-sounds — procedural UI sounds via Web Audio.',
        },
      ],
      htmlAttrs: { lang: 'en' },
    },
  },

  // Live-link the monorepo library source (hot-reload during playground work)
  alias: {
    '@thenormvg/web-have-sounds': libEntry,
  },

  vite: {
    server: {
      fs: {
        allow: [libRoot],
      },
    },
    optimizeDeps: {
      exclude: ['@thenormvg/web-have-sounds'],
    },
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  css: ['~/assets/css/base.css'],
})
