import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  darkMode: 'class',
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
    theme:{
    extend:{
      colors:{
        canvas:'var(--bg)',
        panel:'var(--panel)',
        surface:'var(--card)',
        'surface-hover':'var(--card-hover)',

        line:'var(--border)',

        primary:'var(--primary)',

        foreground:'var(--text)',
        muted:'var(--text-muted)',
      }
    }
  },
  plugins: [],
}
