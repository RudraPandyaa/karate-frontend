<script setup lang="ts">
import type { LiveMatch } from '~/composables/useLiveMatch'

const props = defineProps<{
  match: LiveMatch
  timer: number
  notification: string
  matchStatus: string
  submitting: boolean
  submitError: string | null
  canUndo: boolean
}>()

const emit = defineEmits<{
  score: [corner: 'RED' | 'BLUE', type: 'YUKO' | 'WAZA_ARI' | 'IPPON']
  undoLast: []
  start: []
  pause: []
  adjustTime: [delta: number]
}>()

const scoreTypes = [
  { type: 'YUKO', label: 'Yuko', points: 1 },
  { type: 'WAZA_ARI', label: 'Waza-Ari', points: 2 },
  { type: 'IPPON', label: 'Ippon', points: 3 },
] as const

const formattedTime = computed(() => {
  const mins = Math.floor(props.timer / 60)
  const secs = props.timer % 60
  return `${mins}:${String(secs).padStart(2, '0')}`
})
</script>

<template>
  <div class="max-w-6xl mx-auto space-y-8 text-foreground">

    <!-- Notification -->
    <Transition name="fade">
      <div
        v-if="notification"
        class="rounded-xl border border-blue-500 bg-blue-900/30 px-5 py-3 text-center font-semibold text-blue-200"
      >
        {{ notification }}
      </div>
    </Transition>

    <!-- Error -->
    <div
      v-if="submitError"
      class="rounded-xl border border-red-600 bg-red-950/40 px-5 py-3 text-red-300"
    >
      {{ submitError }}
    </div>

    <!-- Timer -->
    <div
      class="rounded-3xl border border-line bg-panel p-8 text-center"
    >

      <h2 class="text-7xl font-black tracking-wider text-foreground">
        {{ formattedTime }}
      </h2>

      <p
        class="mt-3 text-xl font-bold text-foreground"
        :class="{
          'text-green-400': matchStatus === 'IN_PROGRESS',
          'text-yellow-400': matchStatus === 'PAUSED',
          'text-red-400': matchStatus === 'COMPLETED'
        }"
      >
        {{
          matchStatus === 'IN_PROGRESS'
            ? 'LIVE'
            : matchStatus === 'PAUSED'
            ? 'PAUSED'
            : 'FINISHED'
        }}
      </p>

      <div
        v-if="match.status !== 'IN_PROGRESS'"
        class="mt-5 rounded-lg border border-yellow-700 bg-yellow-950/30 px-4 py-3 text-yellow-300"
      >
        Match is {{ match.status }}. Start the timer before scoring.
      </div>
    </div>

    <!-- Timer Controls -->
    <div
      class="flex flex-wrap justify-center gap-3 rounded-2xl border border-line bg-panel p-6"
    >
      <button
        class="rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-500 text-white"
        :disabled="submitting"
        @click="emit('start')"
      >
        ▶ Start
      </button>

      <button
        class="rounded-lg bg-yellow-600 px-6 py-3 font-semibold hover:bg-yellow-500 text-white"
        :disabled="submitting"
        @click="emit('pause')"
      >
        ⏸ Pause
      </button>

      <button
        class="rounded-lg bg-surface px-5 py-3 font-semibold hover:bg-surface-hover"
        :disabled="submitting"
        @click="emit('adjustTime', -10)"
      >
        −10 sec
      </button>

      <button
        class="rounded-lg bg-surface px-5 py-3 font-semibold hover:bg-surface-hover"
        :disabled="submitting"
        @click="emit('adjustTime', 10)"
      >
        +10 sec
      </button>

      <button
        class="rounded-lg bg-surface px-5 py-3 font-semibold hover:bg-surface-hover"
        :disabled="submitting"
        @click="emit('adjustTime', 30)"
      >
        +30 sec
      </button>
    </div>

    <!-- Score Panels -->
    <div class="grid grid-cols-1 gap-8 md:grid-cols-2">

      <!-- RED -->
      <div
        class="rounded-3xl border-4 border-red-600 bg-red-950/30 p-6"
      >
        <h2 class="mb-2 text-center text-2xl font-bold text-red-300">
          {{ match.redAthlete?.name ?? 'Red Corner' }}
        </h2>

        <div class="mb-6 text-center text-7xl font-black">
          {{ match.redScore }}
        </div>

        <div class="space-y-3">
          <button
            v-for="s in scoreTypes"
            :key="s.type"
            class="w-full rounded-xl bg-red-700 py-4 text-lg font-bold hover:bg-red-600 disabled:opacity-40 text-white"
            :disabled="submitting || match.status !== 'IN_PROGRESS'"
            @click="emit('score','RED',s.type)"
          >
            {{ s.label }} (+{{ s.points }})
          </button>
        </div>
      </div>

      <!-- BLUE -->
      <div
        class="rounded-3xl border-4 border-blue-600 bg-blue-950/30 p-6"
      >
        <h2 class="mb-2 text-center text-2xl font-bold text-blue-300">
          {{ match.blueAthlete?.name ?? 'Blue Corner' }}
        </h2>

        <div class="mb-6 text-center text-7xl font-black">
          {{ match.blueScore }}
        </div>

        <div class="space-y-3">
          <button
            v-for="s in scoreTypes"
            :key="s.type"
            class="w-full rounded-xl bg-blue-700 py-4 text-lg font-bold hover:bg-blue-600 disabled:opacity-40 text-white"
            :disabled="submitting || match.status !== 'IN_PROGRESS'"
            @click="emit('score','BLUE',s.type)"
          >
            {{ s.label }} (+{{ s.points }})
          </button>
        </div>
      </div>

    </div>

    <!-- Undo -->
    <div class="flex justify-center">
      <button
        class="rounded-xl bg-surface px-8 py-4 text-lg font-semibold hover:bg-surface-hover disabled:opacity-30"
        :disabled="!canUndo || submitting"
        @click="emit('undoLast')"
      >
        ↩ Undo Last Score
      </button>
    </div>

  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all .35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>