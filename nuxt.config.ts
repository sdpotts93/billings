/// <reference types="node" />
// https://nuxt.com/docs/api/configuration/nuxt-config
const isDev = process.env.NODE_ENV !== 'production'

export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/ui', '@nuxt/image'],

  devtools: {
    enabled: true
  },

  app: {
    head: {
      meta: [
        { name: 'robots', content: 'noindex,nofollow,noarchive' },
        { name: 'googlebot', content: 'noindex,nofollow,noarchive' }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  ui: {
    experimental: {
      componentDetection: true
    },
    fonts: false,
    colorMode: false
  },

  routeRules: {
    '/': { prerender: true },
    '/share-your-story': { prerender: true },
    '/share-your-story/': { prerender: true },
    '/resources': { prerender: true },
    '/resources/': { prerender: true },
    '/behind-the-scenes': { prerender: true },
    '/behind-the-scenes/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    prerender: {
      routes: ['/', '/share-your-story', '/share-your-story/', '/resources', '/resources/', '/behind-the-scenes', '/behind-the-scenes/']
    }
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ['node']
      }
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  fonts: {
    families: [
      {
        name: 'Veneer',
        provider: 'local',
        global: true,
        preload: true,
        display: 'swap',
        styles: ['normal'],
        weights: [400]
      }
    ]
  },
  image: {
    provider: isDev ? 'ipx' : 'ipxStatic',
    format: ['webp'],
    ipx: {
      modifiers: {
        format: 'webp',
        fit: 'cover'
      }
    }
  }
})
