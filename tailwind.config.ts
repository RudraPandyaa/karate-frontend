import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        // Base app background — deepest navy
        canvas: '#0a0f1c',
        // Sidebar / topbar background
        panel: '#0d1526',
        // Card surfaces
        surface: '#11192c',
        'surface-hover': '#151f36',
        // Borders
        line: '#1e2a42',
        // Corner colors (AKA / AO in kumite)
        aka: '#ef4444', // red corner
        ao: '#3b82f6', // blue corner
        // Text
        muted: '#8b98b3',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
}
