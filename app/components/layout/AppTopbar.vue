<script setup lang="ts">
import { Search, Bell, Moon, Sun, CircleUserRound } from 'lucide-vue-next'

const isDark = ref(true) // TODO: wire to a real theme composable / VueUse useDark if you want light mode later
</script>

<template>
  <header class="flex h-16 items-center justify-between gap-4 border-b border-line bg-panel px-4 lg:px-6">
    <div class="flex items-center gap-3 min-w-0">
      <h1 class="hidden sm:block text-lg font-bold text-white shrink-0">WKF Manager</h1>
      <div class="relative w-full max-w-sm hidden md:block">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="Search athletes, matches..."
          class="w-full rounded-full bg-surface border border-line py-2 pl-9 pr-4 text-sm text-white placeholder:text-muted outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/40"
        />
      </div>
    </div>

    <div class="flex items-center gap-2 sm:gap-3 shrink-0">
      <button
        class="rounded-full bg-blue-600/15 border border-blue-600/30 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-600/25 transition-colors"
      >
        Select Tournament
      </button>

      <button
        class="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell class="h-[18px] w-[18px]" />
      </button>

      <button
        class="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-white transition-colors"
        aria-label="Toggle theme"
        @click="isDark = !isDark"
      >
        <component :is="isDark ? Moon : Sun" class="h-[18px] w-[18px]" />
      </button>

      <button
        class="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-white transition-colors"
        aria-label="Account"
      >
        <CircleUserRound class="h-[20px] w-[20px]" />
      </button>
    </div>
  </header>
</template>
