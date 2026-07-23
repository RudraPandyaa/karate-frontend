<script setup lang="ts">
import type { LiveMatch } from '~/composables/useLiveMatch'

const props = defineProps<{
  match: LiveMatch
}>()

const minutes = computed(() => Math.floor(props.match.timeRemaining / 60))
const seconds = computed(() => props.match.timeRemaining % 60)

const clock = computed(() => {
  const m = String(minutes.value).padStart(2, '0')
  const s = String(seconds.value).padStart(2, '0')
  return `${m}:${s}`
})

const isLowTime = computed(() =>
  props.match.timeRemaining <= 15 &&
  props.match.status === 'IN_PROGRESS'
)
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-10 text-foreground">

    <!-- Status / round -->
    <div class="mb-8 flex items-center gap-3">
      <span
        class="h-2.5 w-2.5 rounded-full"
        :class="
          match.status === 'IN_PROGRESS'
            ? 'bg-green-500 animate-pulse'
            : 'bg-yellow-500'
        "
      />
      <span class="text-sm font-medium uppercase tracking-widest text-foreground/60">
        {{
          match.status === 'IN_PROGRESS'
            ? 'Live'
            : match.status === 'PAUSED'
              ? 'Paused'
              : match.status === 'COMPLETED'
                ? 'Finished'
                : 'Ready'
        }}
      </span>
    </div>

    <!-- Timer -->
    <div
      class="mb-10 font-mono text-7xl font-bold tabular-nums sm:text-8xl"
      :class="isLowTime ? 'text-red-500 animate-pulse' : 'text-foreground'"
    >
      {{ clock }}
    </div>

          <div
        v-if="match.status === 'COMPLETED'"
        class="mb-8 rounded-2xl border border-line bg-panel px-6 py-4 text-center"
      >
        <p class="text-sm uppercase tracking-widest text-foreground/60">
          Match Finished
        </p>

        <p class="mt-2 text-2xl font-bold">
          Winner:
          {{
            match.winnerId === match.redAthlete?.id
              ? match.redAthlete.name
              : match.blueAthlete?.name
          }}
        </p>

        <p
          v-if="match.resultType"
          class="mt-1 text-sm text-foreground/60"
        >
          Result: {{ match.resultType }}
        </p>
      </div>

    <!-- Score panels -->
    <div class="grid w-full max-w-4xl grid-cols-2 gap-6">

      <!-- Red corner -->
      <div class="relative rounded-3xl border-4 border-red-600 bg-red-950/40 px-6 py-10 text-center">

        <div
          v-if="match.senshu === 'RED'"
          class="absolute right-4 top-4 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase text-white"
        >
          Senshu
        </div>

        <p class="text-lg font-semibold uppercase tracking-wide text-red-200">
          {{ match.redAthlete?.name ?? 'Red Corner' }}
        </p>

        <p class="mt-4 font-mono text-8xl font-extrabold text-foreground sm:text-9xl">
          {{ match.redScore }}
        </p>

      </div>

      <!-- Blue corner -->
      <div class="relative rounded-3xl border-4 border-blue-600 bg-blue-950/40 px-6 py-10 text-center">

        <div
          v-if="match.senshu === 'BLUE'"
          class="absolute right-4 top-4 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold uppercase text-white"
        >
          Senshu
        </div>

        <p class="text-lg font-semibold uppercase tracking-wide text-blue-200">
          {{ match.blueAthlete?.name ?? 'Blue Corner' }}
        </p>

        <p class="mt-4 font-mono text-8xl font-extrabold text-foreground sm:text-9xl">
          {{ match.blueScore }}
        </p>

      </div>

    </div>

  </div>
</template>