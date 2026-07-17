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
    <!-- Notification & Error -->
    <Transition name="fade">
      <div v-if="notification" class="rounded-xl border border-blue-500 bg-blue-900/30 px-5 py-3 text-center font-semibold text-blue-200">
        {{ notification }}
      </div>
    </Transition>

    <div v-if="submitError" class="rounded-xl border border-red-600 bg-red-950/40 px-5 py-3 text-red-300">
      {{ submitError }}
    </div>

    <!-- Timer -->
    <div class="rounded-3xl border border-line bg-panel p-8 text-center">
      <h2 class="text-7xl font-black tracking-wider text-foreground">
        {{ formattedTime }}
      </h2>
      <p class="mt-3 text-xl font-bold" 
         :class="{
           'text-green-400': matchStatus === 'IN_PROGRESS',
           'text-yellow-400': matchStatus === 'PAUSED',
           'text-red-400': matchStatus === 'COMPLETED'
         }">
        {{ matchStatus === 'IN_PROGRESS' ? 'LIVE' : matchStatus === 'PAUSED' ? 'PAUSED' : 'FINISHED' }}
      </p>
    </div>

    <!-- Timer Controls -->
    <div class="flex flex-wrap justify-center gap-3 rounded-2xl border border-line bg-panel p-6">
      <button @click="emit('start')" :disabled="submitting" class="rounded-lg bg-green-600 px-6 py-3 font-semibold hover:bg-green-500 text-white">▶ Start</button>
      <button @click="emit('pause')" :disabled="submitting" class="rounded-lg bg-yellow-600 px-6 py-3 font-semibold hover:bg-yellow-500 text-white">⏸ Pause</button>
      <button @click="emit('adjustTime', -10)" :disabled="submitting" class="rounded-lg bg-surface px-5 py-3 font-semibold hover:bg-surface-hover">-10s</button>
      <button @click="emit('adjustTime', 10)" :disabled="submitting" class="rounded-lg bg-surface px-5 py-3 font-semibold hover:bg-surface-hover">+10s</button>
      <button @click="emit('adjustTime', 30)" :disabled="submitting" class="rounded-lg bg-surface px-5 py-3 font-semibold hover:bg-surface-hover">+30s</button>
    </div>

    
    <!-- Main Score Area with Photos -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- RED CORNER -->
      <div class="rounded-3xl border-4 border-red-600 bg-red-950/30 p-8 text-center">
        <div class="mx-auto w-40 h-40 rounded-2xl overflow-hidden border-4 border-red-500 shadow-xl mb-6">
          <img 
            :src="match.redAthlete?.photoUrl || '/default-athlete-red.png'" 
            class="w-full h-full object-cover"
            alt="Red Athlete"
          />
        </div>
        <h2 class="text-3xl font-bold text-red-100 mb-4">
          {{ match.redAthlete?.name ?? 'Red Corner' }}
        </h2>
        <div class="text-8xl font-black text-red-400 mb-8">
          {{ match.redScore ?? 0 }}
        </div>

        <div class="space-y-3">
          <button
            v-for="s in scoreTypes"
            :key="s.type"
            class="w-full rounded-2xl bg-red-700 py-5 text-xl font-bold hover:bg-red-600 disabled:opacity-50 text-white"
            :disabled="submitting || match.status !== 'IN_PROGRESS'"
            @click="emit('score', 'RED', s.type)"
          >
            {{ s.label }} (+{{ s.points }})
          </button>
        </div>
      </div>

      <!-- BLUE CORNER -->
      <div class="rounded-3xl border-4 border-blue-600 bg-blue-950/30 p-8 text-center">
        <div class="mx-auto w-40 h-40 rounded-2xl overflow-hidden border-4 border-blue-500 shadow-xl mb-6">
          <img 
            :src="match.blueAthlete?.photoUrl || '/default-athlete-blue.png'" 
            class="w-full h-full object-cover"
            alt="Blue Athlete"
          />
        </div>
        <h2 class="text-3xl font-bold text-blue-100 mb-4">
          {{ match.blueAthlete?.name ?? 'Blue Corner' }}
        </h2>
        <div class="text-8xl font-black text-blue-400 mb-8">
          {{ match.blueScore ?? 0 }}
        </div>

        <div class="space-y-3">
          <button
            v-for="s in scoreTypes"
            :key="s.type"
            class="w-full rounded-2xl bg-blue-700 py-5 text-xl font-bold hover:bg-blue-600 disabled:opacity-50 text-white"
            :disabled="submitting || match.status !== 'IN_PROGRESS'"
            @click="emit('score', 'BLUE', s.type)"
          >
            {{ s.label }} (+{{ s.points }})
          </button>
        </div>
      </div>
    </div>

    <!-- Undo -->
    <div class="flex justify-center">
      <button
        :disabled="!canUndo || submitting"
        @click="emit('undoLast')"
        class="rounded-2xl bg-surface px-10 py-5 text-lg font-semibold hover:bg-surface-hover disabled:opacity-50"
      >
        ↩ Undo Last Score
      </button>
    </div>
  </div>
</template>