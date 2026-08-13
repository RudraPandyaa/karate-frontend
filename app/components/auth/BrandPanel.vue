<script setup lang="ts">
import { Trophy, Users, Star } from 'lucide-vue-next'
</script>

<template>
  <div class="relative hidden lg:block w-1/2 bg-cover bg-center"
    style="background-image: url('/images/auth-bg.jpg');">

    <!-- Dot-grid texture -->
    <div
      class="pointer-events-none absolute inset-0 opacity-30"
      style="background-image: radial-gradient(circle, rgba(59,130,246,0.4) 1px, transparent 1px); background-size: 20px 20px;"
    />

    <!-- Diagonal light streaks (slow pulse, not particles) -->
    <div class="pointer-events-none absolute -top-16 -left-16 h-80 w-80 rotate-45 bg-gradient-to-b from-red-500/50 via-red-500/10 to-transparent blur-md animate-streak-pulse" />
    <div class="pointer-events-none absolute -bottom-16 -right-16 h-96 w-96 rotate-45 bg-gradient-to-t from-blue-500/40 via-blue-500/10 to-transparent blur-md animate-streak-pulse" style="animation-delay: 1.5s;" />

    <div class="relative z-10 max-w-md">
      <!-- WKF ring logo -->
      <div
        class="mb-6 flex h-24 w-24 items-center justify-center rounded-full p-[3px]"
        style="background: conic-gradient(from 180deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #ef4444);"
      >
        <div class="flex h-full w-full items-center justify-center rounded-full bg-[#050b16]">
          <span class="text-2xl font-black tracking-wide text-white">WKF</span>
        </div>
      </div>

      <h1 class="text-6xl font-black uppercase leading-none tracking-tight text-white">
        WKF
      </h1>
      <h2 class="mt-1 text-5xl font-black uppercase leading-none tracking-tight text-red-500">
        Manager
      </h2>

      <div class="mt-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-white/60">
        <span>Discipline</span>
        <span class="text-red-500">•</span>
        <span>Focus</span>
        <span class="text-red-500">•</span>
        <span>Victory</span>
      </div>

      <!-- Value icons -->
      <div class="mt-14 grid grid-cols-3 gap-6">
        <div class="text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-red-500 text-red-500">
            <Trophy class="h-6 w-6" />
          </div>
          <p class="text-sm font-bold uppercase tracking-wide text-white">Compete</p>
          <p class="mt-1 text-xs text-white/50">Show your skills</p>
        </div>
        <div class="text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-blue-500 text-blue-500">
            <Users class="h-6 w-6" />
          </div>
          <p class="text-sm font-bold uppercase tracking-wide text-white">Respect</p>
          <p class="mt-1 text-xs text-white/50">Honor your opponent</p>
        </div>
        <div class="text-center">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-green-500 text-green-500">
            <Star class="h-6 w-6" />
          </div>
          <p class="text-sm font-bold uppercase tracking-wide text-white">Achieve</p>
          <p class="mt-1 text-xs text-white/50">Be a Champion</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes streak-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
.animate-streak-pulse {
  animation: streak-pulse 4s ease-in-out infinite;
}
</style>