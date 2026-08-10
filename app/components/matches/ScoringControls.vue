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
  score: [corner: 'RED' | 'BLUE', type: 'YUKO' | 'WAZA_ARI' | 'IPPON']
  penalty: [corner: 'RED' | 'BLUE', type: 'CHUI' | 'HANSOKU_CHUI' | 'HANSOKU']
  undoLast: []
  start: []
  pause: []
  adjustTime: [delta: number]
  restart: []
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

function penaltyActive(corner: 'RED' | 'BLUE', key: 'chui' | 'hansokuChui' | 'hansoku') {
  const p = corner === 'RED' ? props.match.penalties?.red : props.match.penalties?.blue
  if (!p) return false
  if (key === 'chui') return (p.chui ?? 0) > 0
  if (key === 'hansokuChui') return (p.hansokuChui ?? 0) > 0
  return (p.hansoku ?? 0) > 0
}

function penaltyCount(corner: 'RED' | 'BLUE', key: 'chui' | 'hansokuChui' | 'hansoku') {
  const p = corner === 'RED' ? props.match.penalties?.red : props.match.penalties?.blue
  if (!p) return 0
  if (key === 'chui') return p.chui ?? 0
  if (key === 'hansokuChui') return p.hansokuChui ?? 0
  return p.hansoku ?? 0
}

function getAthleteName(athlete?: any) {
  if (!athlete) return 'TBD'
  return (
    athlete.fullName ||
    athlete.name ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}

function athleteInitials(athlete?: any): string {
  if (!athlete) return '?'
  const first = (athlete.firstName || '').trim()
  const last = (athlete.lastName || '').trim()
  if (first || last) {
    return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '?'
  }
  const name = (athlete.fullName || athlete.name || '').trim()
  if (!name) return '?'
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

import countries from 'i18n-iso-countries'

function flagUrl(country?: string | null): string | null {
  if (!country) return null

  const raw = country.trim()
  let alpha2: string | undefined

  if (raw.length === 2) {
    alpha2 = raw.toUpperCase()
  } else if (raw.length === 3) {
    alpha2 = countries.alpha3ToAlpha2(raw.toUpperCase())
  } else {
    alpha2 = countries.getAlpha2Code(raw, 'en') ?? undefined
  }

  if (!alpha2) return null
  return `https://flagcdn.com/24x18/${alpha2.toLowerCase()}.png`
}

const isActive = computed(
  () => props.match.status === 'IN_PROGRESS',
)

const isFinished = computed(
  () => props.match.status === 'COMPLETED',
)

function breakdown(corner: 'RED' | 'BLUE') {
  const events = props.match.scoreEvents ?? []
  return {
    ippon: events.filter(
      (e) => e.corner === corner && e.type === 'IPPON' && !e.wasUndone,
    ).length,
    wazaAri: events.filter(
      (e) => e.corner === corner && e.type === 'WAZA_ARI' && !e.wasUndone,
    ).length,
    yuko: events.filter(
      (e) => e.corner === corner && e.type === 'YUKO' && !e.wasUndone,
    ).length,
  }
}

const redBreakdown = computed(() => breakdown('RED'))
const blueBreakdown = computed(() => breakdown('BLUE'))

function winnerLabel() {
  if (!props.match.winnerId) return null
  if (props.match.winnerId === props.match.redAthlete?.id) {
    return getAthleteName(props.match.redAthlete)
  }
  if (props.match.winnerId === props.match.blueAthlete?.id) {
    return getAthleteName(props.match.blueAthlete)
  }
  return null
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
          :disabled="submitting || match.status !== 'PAUSED'"
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
    <div
      v-if="match.status === 'IN_PROGRESS'"
      class="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-center text-sm text-yellow-300"
    >
      Pause the match to record scores or penalties
    </div>

        <!-- Main board: RED | TIMER | BLUE -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">

          <!-- ========== AKA RED ========== -->
          <div class="rounded-3xl border-4 border-red-600 bg-red-950/25 p-5">
            <div class="mb-3 text-center text-sm font-bold tracking-widest text-red-400">
              AKA
            </div>

            <!-- Photo -->
            <div class="mx-auto mb-3 h-24 w-24 overflow-hidden rounded-2xl border-2 border-red-500 bg-red-900 flex items-center justify-center">
              <img
                v-if="match.redAthlete?.photoUrl"
                :src="match.redAthlete.photoUrl"
                class="h-full w-full object-cover"
              />
              <span
                v-else
                class="text-2xl font-black text-red-100 tracking-wide"
              >
                {{ athleteInitials(match.redAthlete) }}
              </span>
            </div>

            <!-- Name + country -->
            <h2 class="mb-1 text-center text-xl font-bold text-red-100">
              {{ getAthleteName(match.redAthlete) }}
            </h2>
            <p
              v-if="match.redAthlete?.country"
              class="mb-4 flex items-center justify-center gap-2 text-sm text-red-300/80"
            >
              <img
                v-if="flagUrl(match.redAthlete.country)"
                :src="flagUrl(match.redAthlete.country)!"
                :alt="match.redAthlete.country"
                class="h-4 w-auto rounded-sm"
                loading="lazy"
              />
            </p>

            <!-- Score -->
            <div class="mb-5 text-center text-7xl font-black text-red-400">
              {{ match.redScore ?? 0 }}
            </div>


            <!-- Senshu -->
            <div
              v-if="match.senshu === 'RED'"
              class="mb-3 text-center"
            >
              <span class="rounded-full bg-red-500 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                SENSHU
              </span>
            </div>

            <!-- I / W / Y -->
            <div class="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div class="rounded-lg bg-red-950/50 py-2">
                <p class="text-red-300/70">Ippon</p>
                <p class="text-lg font-bold text-red-200">{{ redBreakdown.ippon }}</p>
              </div>
              <div class="rounded-lg bg-red-950/50 py-2">
                <p class="text-red-300/70">Waza-Ari</p>
                <p class="text-lg font-bold text-red-200">{{ redBreakdown.wazaAri }}</p>
              </div>
              <div class="rounded-lg bg-red-950/50 py-2">
                <p class="text-red-300/70">Yuko</p>
                <p class="text-lg font-bold text-red-200">{{ redBreakdown.yuko }}</p>
              </div>
            </div>

            <!-- Point buttons -->
            <div class="space-y-2">
              <button
                v-for="s in scoreTypes"
                :key="'R-' + s.type"
                type="button"
                class="w-full rounded-xl bg-red-700 py-3 font-bold text-white hover:bg-red-600 disabled:opacity-50"
                :disabled="submitting || match.status !== 'PAUSED'"
                @click="emit('score', 'RED', s.type)"
              >
                {{ s.label }} (+{{ s.points }})
              </button>
            </div>

            <!-- Penalties -->
            <div class="mt-4 rounded-xl border border-red-800/50 bg-red-950/40 p-3">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">
                Penalties
              </p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class="rounded-lg py-2 text-xs font-bold disabled:opacity-50"
                  :class="penaltyCount('RED', 'chui') > 0 ? 'bg-red-600 text-white' : 'bg-red-900/50 text-red-200'"
                  :disabled="submitting || match.status !== 'PAUSED'"
                  @click="emit('penalty', 'RED', 'CHUI')"
                >
                  C1
                </button>
                <button
                  type="button"
                  class="rounded-lg py-2 text-xs font-bold disabled:opacity-50"
                  :class="penaltyCount('RED', 'hansokuChui') > 0 ? 'bg-red-600 text-white' : 'bg-red-900/50 text-red-200'"
                  :disabled="submitting || match.status !== 'PAUSED'"
                  @click="emit('penalty', 'RED', 'HANSOKU_CHUI')"
                >
                  HC
                </button>
                <button
                  type="button"
                  class="rounded-lg py-2 text-xs font-bold disabled:opacity-50"
                  :class="penaltyCount('RED', 'hansoku') > 0 ? 'bg-red-500 text-white' : 'bg-red-900/50 text-red-200'"
                  :disabled="submitting || match.status !== 'PAUSED'"
                  @click="emit('penalty', 'RED', 'HANSOKU')"
                >
                  H
                </button>
              </div>
            </div>
          </div>

          <!-- ========== CENTER TIMER ========== -->
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
                  type="button"
                  class="rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                  :disabled="submitting || match.status === 'IN_PROGRESS' || match.status === 'COMPLETED'"
                  @click="emit('start')"
                >
                  {{ match.status === 'PAUSED' ? '▶ Resume' : '▶ Start' }}
                </button>
                <button
                  type="button"
                  class="rounded-xl bg-yellow-600 py-3 font-semibold text-white hover:bg-yellow-500 disabled:opacity-50"
                  :disabled="submitting || match.status !== 'IN_PROGRESS'"
                  @click="emit('pause')"
                >
                  ⏸ Pause
                </button>
              </div>

              <button
                type="button"
                class="w-full rounded-xl border border-line bg-surface py-3 font-semibold text-foreground transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
                :disabled="submitting || match.status === 'SCHEDULED'"
                @click="emit('restart')"
              >
                ↺ Restart Match
              </button>

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
                  type="button"
                  class="rounded-xl bg-red-700 px-3 py-2 text-white disabled:opacity-50"
                  :disabled="submitting || match.status !== 'PAUSED' || customTimeDelta === null"
                  @click="customTimeDelta !== null && emit('adjustTime', -customTimeDelta)"
                >
                  −
                </button>
                <button
                  type="button"
                  class="rounded-xl bg-green-700 px-3 py-2 text-white disabled:opacity-50"
                  :disabled="submitting || match.status !== 'PAUSED' || customTimeDelta === null"
                  @click="customTimeDelta !== null && emit('adjustTime', customTimeDelta)"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          <!-- ========== AO BLUE ========== -->
          <div class="rounded-3xl border-4 border-blue-600 bg-blue-950/25 p-5">
            <div class="mb-3 text-center text-sm font-bold tracking-widest text-blue-400">
              AO
            </div>

            <div class="mx-auto mb-3 h-24 w-24 overflow-hidden rounded-2xl border-2 border-blue-500 bg-blue-900 flex items-center justify-center">
              <img
                v-if="match.blueAthlete?.photoUrl"
                :src="match.blueAthlete.photoUrl"
                class="h-full w-full object-cover"
              />
              <span
                v-else
                class="text-2xl font-black text-blue-100 tracking-wide"
              >
                {{ athleteInitials(match.blueAthlete) }}
              </span>
            </div>

            <h2 class="mb-1 text-center text-xl font-bold text-blue-100">
              {{ getAthleteName(match.blueAthlete) }}
            </h2>
            <p
              v-if="match.blueAthlete?.country"
              class="mb-4 flex items-center justify-center gap-2 text-sm text-blue-300/80"
            >
              <img
                v-if="flagUrl(match.blueAthlete.country)"
                :src="flagUrl(match.blueAthlete.country)!"
                :alt="match.blueAthlete.country"
                class="h-4 w-auto rounded-sm"
                loading="lazy"
              />
            </p>

            <div class="mb-5 text-center text-7xl font-black text-blue-400">
              {{ match.blueScore ?? 0 }}
            </div>

            <!-- Senshu -->
            <div
              v-if="match.senshu === 'BLUE'"
              class="mb-3 text-center"
            >
              <span class="rounded-full bg-blue-500 px-3 py-1 text-xs font-black uppercase tracking-widest text-white">
                SENSHU
              </span>
            </div>

            <!-- I / W / Y -->
            <div class="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
              <div class="rounded-lg bg-blue-950/50 py-2">
                <p class="text-blue-300/70">Ippon</p>
                <p class="text-lg font-bold text-blue-200">{{ blueBreakdown.ippon }}</p>
              </div>
              <div class="rounded-lg bg-blue-950/50 py-2">
                <p class="text-blue-300/70">Waza-Ari</p>
                <p class="text-lg font-bold text-blue-200">{{ blueBreakdown.wazaAri }}</p>
              </div>
              <div class="rounded-lg bg-blue-950/50 py-2">
                <p class="text-blue-300/70">Yuko</p>
                <p class="text-lg font-bold text-blue-200">{{ blueBreakdown.yuko }}</p>
              </div>
            </div>

            <div class="space-y-2">
              <button
                v-for="s in scoreTypes"
                :key="'B-' + s.type"
                type="button"
                class="w-full rounded-xl bg-blue-700 py-3 font-bold text-white hover:bg-blue-600 disabled:opacity-50"
                :disabled="submitting || match.status !== 'PAUSED'"
                @click="emit('score', 'BLUE', s.type)"
              >
                {{ s.label }} (+{{ s.points }})
              </button>
            </div>

            <div class="mt-4 rounded-xl border border-blue-800/50 bg-blue-950/40 p-3">
              <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-300">
                Penalties
              </p>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  class="rounded-lg py-2 text-xs font-bold disabled:opacity-50"
                  :class="penaltyCount('BLUE', 'chui') > 0 ? 'bg-blue-600 text-white' : 'bg-blue-900/50 text-blue-200'"
                  :disabled="submitting || match.status !== 'PAUSED'"
                  @click="emit('penalty', 'BLUE', 'CHUI')"
                >
                  C1
                </button>
                <button
                  type="button"
                  class="rounded-lg py-2 text-xs font-bold disabled:opacity-50"
                  :class="penaltyCount('BLUE', 'hansokuChui') > 0 ? 'bg-blue-600 text-white' : 'bg-blue-900/50 text-blue-200'"
                  :disabled="submitting || match.status !== 'PAUSED'"
                  @click="emit('penalty', 'BLUE', 'HANSOKU_CHUI')"
                >
                  HC
                </button>
                <button
                  type="button"
                  class="rounded-lg py-2 text-xs font-bold disabled:opacity-50"
                  :class="penaltyCount('BLUE', 'hansoku') > 0 ? 'bg-blue-500 text-white' : 'bg-blue-900/50 text-blue-200'"
                  :disabled="submitting || match.status !== 'PAUSED'"
                  @click="emit('penalty', 'BLUE', 'HANSOKU')"
                >
                  H
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- Match finished banner -->
    <div
      v-if="isFinished"
      class="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 px-5 py-4 text-center"
    >
      <p class="text-xs font-bold uppercase tracking-widest text-yellow-300/80">
        Match Complete
      </p>
      <p
        v-if="winnerLabel()"
        class="mt-1 text-xl font-black text-yellow-300"
      >
        Winner: {{ winnerLabel() }}
      </p>
      <p
        v-if="match.resultType"
        class="mt-1 text-sm uppercase tracking-wide text-muted"
      >
        {{ match.resultType }}
      </p>
    </div>
  </div>
</template>