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
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'theme-color', content: '#f8f5ee' },
        { name: 'robots', content: 'noindex,nofollow,noarchive' },
        { name: 'googlebot', content: 'noindex,nofollow,noarchive' }
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico' }
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
    '/about-the-film': { prerender: true },
    '/about-the-film/': { prerender: true },
    '/share-your-story': { prerender: true },
    '/share-your-story/': { prerender: true },
    '/resources': { prerender: true },
    '/resources/': { prerender: true },
    '/behind-the-scenes': { prerender: true },
    '/behind-the-scenes/': { prerender: true },
    '/privacy-policy': { prerender: true },
    '/privacy-policy/': { prerender: true }
  },

  compatibilityDate: '2025-01-15',

  nitro: {
    prerender: {
      routes: ['/', '/about-the-film', '/about-the-film/', '/share-your-story', '/share-your-story/', '/resources', '/resources/', '/behind-the-scenes', '/behind-the-scenes/', '/privacy-policy', '/privacy-policy/']
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
