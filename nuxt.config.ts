// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt'],

  // components: [
  //   {
  //     path: '~/components',
  //     pathPrefix: false,
  //   },
  // ],

  app: {
    head: {
      title: 'WKF Manager | Tournament Dashboard',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },

  css: ['~/assets/css/main.css'],
})