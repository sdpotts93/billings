// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
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

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
