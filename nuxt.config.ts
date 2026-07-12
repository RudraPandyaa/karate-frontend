// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@vueuse/nuxt'],

  app: {
    head: {
      title: 'WKF Manager | Tournament Dashboard',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },

  // NUXT_PUBLIC_API_BASE in .env overrides this at runtime.
  // Your NestJS app has no global prefix set (SwaggerModule.setup('api', ...)
  // only mounts the docs UI at /api — it does NOT prefix your routes).
  // So this should be just the host:port, e.g. http://localhost:3001
  // — NOT http://localhost:3001/api. Swagger docs live at /api separately.
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },

  css: ['~/assets/css/main.css'],
})