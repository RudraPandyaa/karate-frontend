<script setup lang="ts">
import type { LiveMatchState } from '~/composables/useLiveMatch'

const props = defineProps<{
  match: LiveMatchState
}>()

const minutes = computed(() => Math.floor(props.match.timeRemaining / 60))
const seconds = computed(() => props.match.timeRemaining % 60)

const clock = computed(() => {
  const m = String(minutes.value).padStart(2, '0')
  const s = String(seconds.value).padStart(2, '0')
  return `${m}:${s}`
})

const isLowTime = computed(() => props.match.timeRemaining <= 15 && props.match.isRunning)
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-black px-6 py-10 text-white">

    <!-- Status / round -->
    <div class="mb-8 flex items-center gap-3">
      <span
        class="h-2.5 w-2.5 rounded-full"
        :class="match.isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'"
      />
      <span class="text-sm font-medium uppercase tracking-widest text-white/60">
        {{ match.isRunning ? 'Live' : match.status }}
      </span>
    </div>

    <!-- Timer -->
    <div
      class="mb-10 font-mono text-7xl font-bold tabular-nums sm:text-8xl"
      :class="isLowTime ? 'text-red-500 animate-pulse' : 'text-white'"
    >
      {{ clock }}
    </div>

    <!-- Score panels -->
    <div class="grid w-full max-w-4xl grid-cols-2 gap-6">

      <!-- Red corner -->
      <div class="relative rounded-3xl border-4 border-red-600 bg-red-950/40 px-6 py-10 text-center">

        <div
          v-if="match.senshu === 'RED'"
          class="absolute right-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase"
        >
          Senshu
        </div>

        <p class="text-lg font-semibold uppercase tracking-wide text-red-200">
          {{ match.redAthlete?.name ?? 'Red Corner' }}
        </p>

        <p class="mt-4 font-mono text-8xl font-extrabold text-white sm:text-9xl">
          {{ match.redScore }}
        </p>

      </div>

      <!-- Blue corner -->
      <div class="relative rounded-3xl border-4 border-blue-600 bg-blue-950/40 px-6 py-10 text-center">

        <div
          v-if="match.senshu === 'BLUE'"
          class="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase"
        >
          Senshu
        </div>

        <p class="text-lg font-semibold uppercase tracking-wide text-blue-200">
          {{ match.blueAthlete?.name ?? 'Blue Corner' }}
        </p>

        <p class="mt-4 font-mono text-8xl font-extrabold text-white sm:text-9xl">
          {{ match.blueScore }}
        </p>

      </div>

    </div>

  </div>
</template>