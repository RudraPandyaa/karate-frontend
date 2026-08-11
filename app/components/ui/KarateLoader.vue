<script setup lang="ts">
defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-5 py-16">

    <div class="relative h-24 w-24">

      <!-- Dojo energy -->
      <div
        class="absolute inset-2 rounded-full border border-blue-500/10"
      />

      <div
        class="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"
        style="animation-duration: 1.8s"
      />

      <!-- Reverse ring -->
      <div
        class="absolute inset-3 rounded-full border border-transparent border-b-blue-400/60 animate-spin"
        style="
          animation-duration: 2.5s;
          animation-direction: reverse;
        "
      />

      <!-- Center -->
      <div
        class="
          absolute
          left-1/2
          top-1/2
          flex
          h-12
          w-12
          -translate-x-1/2
          -translate-y-1/2
          items-center
          justify-center
          rounded-full
          bg-blue-600
          shadow-xl
          shadow-blue-600/30
          animate-pulse
        "
      >
        <span class="text-sm font-black tracking-wider text-white">
          K
        </span>
      </div>


    </div>

    <div class="text-center">

      <p class="text-sm font-semibold text-foreground">
        {{ text || 'Preparing your match data...' }}
      </p>

      <div class="mt-2 flex items-center justify-center gap-1.5">
        <span
          class="h-1 w-1 rounded-full bg-blue-500 animate-bounce"
        />
        <span
          class="h-1 w-1 rounded-full bg-blue-500 animate-bounce"
          style="animation-delay: 120ms"
        />
        <span
          class="h-1 w-1 rounded-full bg-blue-500 animate-bounce"
          style="animation-delay: 240ms"
        />
      </div>

      <p class="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted">
        Stay focused · Stay ready
      </p>

    </div>

  </div>
</template>