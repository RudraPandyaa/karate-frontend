<script setup lang="ts">
import type { LiveMatch } from '~/composables/useLiveMatch'

const props = defineProps<{
  match: LiveMatch
  timer: number
  notification: string
  notificationType: 'success' | 'error' | 'info'
  submitting: boolean
  submitError: string | null
  canUndo: boolean
}>()

const emit = defineEmits<{
  score: [
    corner: 'RED' | 'BLUE',
    type: 'YUKO' | 'WAZA_ARI' | 'IPPON',
  ]
  undoLast: []
  start: []
  pause: []
  adjustTime: [delta: number]
}>()

const scoreTypes = [
  {
    type: 'YUKO',
    label: 'Yuko',
    points: 1,
  },
  {
    type: 'WAZA_ARI',
    label: 'Waza-Ari',
    points: 2,
  },
  {
    type: 'IPPON',
    label: 'Ippon',
    points: 3,
  },
] as const

const safeTimer = computed(() =>
  Math.max(0, props.timer),
)

const formattedTime = computed(() => {
  const totalSeconds = Math.max(
    0,  
    Math.floor(Number(props.timer) || 0),
  )

  const mins = Math.floor(
    totalSeconds / 60,
  )

  const secs =
    totalSeconds % 60

  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
})  

const customSeconds = ref<number | null>(null)

const customTimeDelta = computed(() => {
  if (
    customSeconds.value === null ||
    !Number.isInteger(customSeconds.value) ||
    customSeconds.value <= 0
  ) {
    return null
  }

  return customSeconds.value
})

function getAthleteName(athlete?: any) {
  if (!athlete) return 'TBD'
  return (
    athlete.fullName ||
    athlete.name ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-4 text-foreground">

    <!-- Top bar -->
    <div class="flex items-center justify-between rounded-2xl border border-line bg-panel px-5 py-3">
      <div class="flex items-center gap-3">
        <span
          class="rounded-full px-3 py-1 text-xs font-bold"
          :class="match.status === 'IN_PROGRESS' ? 'bg-green-600 text-white' : 'bg-surface text-muted'"
        >
          {{ match.status === 'IN_PROGRESS' ? 'LIVE' : match.status }}
        </span>
        <div>
          <p class="font-semibold">
            {{ match.category?.name || 'Match' }}
          </p>
          <p class="text-xs text-muted">
            {{ match.round }} · Tatami {{ match.tatami?.number || match.tatami?.name || '—' }}
          </p>
        </div>
      </div>

      <button
        :disabled="!canUndo || submitting"
        class="rounded-xl bg-surface px-4 py-2 text-sm hover:bg-surface-hover disabled:opacity-50"
        @click="emit('undoLast')"
      >
        ↩ Undo Last
      </button>
    </div>

    <!-- Notification / Error -->
    <div v-if="notification" class="rounded-xl border border-blue-500/40 bg-blue-950/30 px-4 py-2 text-center text-sm">
      {{ notification }}
    </div>
    <div v-if="submitError" class="rounded-xl border border-red-600 bg-red-950/40 px-4 py-2 text-red-300 text-sm">
      {{ submitError }}
    </div>

    <!-- Main board: RED | TIMER | BLUE -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

      <!-- AKA RED -->
      <div class="rounded-3xl border-4 border-red-600 bg-red-950/25 p-5">
        <div class="mb-3 text-center text-sm font-bold tracking-widest text-red-400">AKA</div>

        <div class="mx-auto mb-3 h-24 w-24 overflow-hidden rounded-2xl border-2 border-red-500">
          <img
            :src="match.redAthlete?.photoUrl || '/default-athlete-red.png'"
            class="h-full w-full object-cover"
          />
        </div>

        <h2 class="mb-1 text-center text-xl font-bold text-red-100">
          {{ getAthleteName(match.redAthlete) }}
        </h2>
        <p class="mb-4 text-center text-sm text-red-300/80">
          {{ match.redAthlete?.country || '' }}
        </p>

        <div class="mb-5 text-center text-7xl font-black text-red-400">
          {{ match.redScore ?? 0 }}
        </div>

        <div class="space-y-2">
          <button
            v-for="s in scoreTypes"
            :key="'R-' + s.type"
            class="w-full rounded-xl bg-red-700 py-3 font-bold text-white hover:bg-red-600 disabled:opacity-50"
            :disabled="submitting || match.status !== 'IN_PROGRESS'"
            @click="emit('score', 'RED', s.type)"
          >
            {{ s.label }} (+{{ s.points }})
          </button>
        </div>

        <!-- Foul placeholder (visual for now) -->
        <div class="mt-4 rounded-xl border border-red-800/50 bg-red-950/40 p-3">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">Penalties</p>
          <div class="flex gap-2">
            <span class="rounded bg-red-900 px-2 py-1 text-xs">C1</span>
            <span class="rounded bg-red-900/40 px-2 py-1 text-xs text-muted">C2</span>
            <span class="rounded bg-red-900/40 px-2 py-1 text-xs text-muted">HC</span>
          </div>
        </div>
      </div>

      <!-- CENTER TIMER + CONTROLS -->
      <div class="flex flex-col gap-4">
        <div class="rounded-3xl border border-line bg-panel p-6 text-center">
          <p class="text-sm text-muted">TIME</p>
          <h2 class="mt-2 text-6xl font-black tracking-wider">
            {{ formattedTime }}
          </h2>
          <p
            class="mt-2 font-bold"
            :class="{
              'text-green-400': match.status === 'IN_PROGRESS',
              'text-yellow-400': match.status === 'PAUSED',
              'text-red-400': match.status === 'COMPLETED',
              'text-blue-400': match.status === 'SCHEDULED',
            }"
          >
            {{
              match.status === 'IN_PROGRESS' ? 'LIVE'
              : match.status === 'PAUSED' ? 'PAUSED'
              : match.status === 'COMPLETED' ? 'FINISHED'
              : 'READY'
            }}
          </p>
        </div>

        <div class="rounded-2xl border border-line bg-panel p-4 space-y-3">
          <div class="grid grid-cols-2 gap-2">
            <button
              class="rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-500 disabled:opacity-50"
              :disabled="submitting || match.status === 'IN_PROGRESS' || match.status === 'COMPLETED'"
              @click="emit('start')"
            >
              {{ match.status === 'PAUSED' ? '▶ Resume' : '▶ Start' }}
            </button>
            <button
              class="rounded-xl bg-yellow-600 py-3 font-semibold text-white hover:bg-yellow-500 disabled:opacity-50"
              :disabled="submitting || match.status !== 'IN_PROGRESS'"
              @click="emit('pause')"
            >
              ⏸ Pause
            </button>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model.number="customSeconds"
              type="number"
              min="1"
              placeholder="Sec"
              class="w-full rounded-xl border border-line bg-surface px-3 py-2 text-center disabled:opacity-50"
              :disabled="submitting || match.status !== 'PAUSED'"
            />
            <button
              class="rounded-xl bg-red-700 px-3 py-2 text-white disabled:opacity-50"
              :disabled="submitting || match.status !== 'PAUSED' || customTimeDelta === null"
              @click="customTimeDelta !== null && emit('adjustTime', -customTimeDelta)"
            >
              −
            </button>
            <button
              class="rounded-xl bg-green-700 px-3 py-2 text-white disabled:opacity-50"
              :disabled="submitting || match.status !== 'PAUSED' || customTimeDelta === null"
              @click="customTimeDelta !== null && emit('adjustTime', customTimeDelta)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <!-- AO BLUE -->
      <div class="rounded-3xl border-4 border-blue-600 bg-blue-950/25 p-5">
        <div class="mb-3 text-center text-sm font-bold tracking-widest text-blue-400">AO</div>

        <div class="mx-auto mb-3 h-24 w-24 overflow-hidden rounded-2xl border-2 border-blue-500">
          <img
            :src="match.blueAthlete?.photoUrl || '/default-athlete-blue.png'"
            class="h-full w-full object-cover"
          />
        </div>

        <h2 class="mb-1 text-center text-xl font-bold text-blue-100">
          {{ getAthleteName(match.blueAthlete) }}
        </h2>
        <p class="mb-4 text-center text-sm text-blue-300/80">
          {{ match.blueAthlete?.country || '' }}
        </p>

        <div class="mb-5 text-center text-7xl font-black text-blue-400">
          {{ match.blueScore ?? 0 }}
        </div>

        <div class="space-y-2">
          <button
            v-for="s in scoreTypes"
            :key="'B-' + s.type"
            class="w-full rounded-xl bg-blue-700 py-3 font-bold text-white hover:bg-blue-600 disabled:opacity-50"
            :disabled="submitting || match.status !== 'IN_PROGRESS'"
            @click="emit('score', 'BLUE', s.type)"
          >
            {{ s.label }} (+{{ s.points }})
          </button>
        </div>

        <div class="mt-4 rounded-xl border border-blue-800/50 bg-blue-950/40 p-3">
          <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-300">Penalties</p>
          <div class="flex gap-2">
            <span class="rounded bg-blue-900 px-2 py-1 text-xs">C1</span>
            <span class="rounded bg-blue-900/40 px-2 py-1 text-xs text-muted">C2</span>
            <span class="rounded bg-blue-900/40 px-2 py-1 text-xs text-muted">HC</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>