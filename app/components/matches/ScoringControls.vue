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

const formattedTime = computed(() => {
  const mins = Math.floor(props.timer / 60)
  const secs = props.timer % 60

  return `${mins}:${String(secs).padStart(2, '0')}`
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
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-8 text-foreground">

    <!-- Notification -->
    <Transition name="fade">
      <div
        v-if="notification"
        class="rounded-xl px-5 py-3 text-center font-semibold"
        :class="{
          'border border-green-500 bg-green-900/30 text-green-200':
            notificationType === 'success',

          'border border-red-500 bg-red-900/30 text-red-200':
            notificationType === 'error',

          'border border-blue-500 bg-blue-900/30 text-blue-200':
            notificationType === 'info',
        }"
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
    <div class="rounded-3xl border border-line bg-panel p-8 text-center">
      <h2 class="text-7xl font-black tracking-wider text-foreground">
        {{ formattedTime }}
      </h2>

      <p
        class="mt-3 text-xl font-bold"
        :class="{
          'text-green-400': match.status === 'IN_PROGRESS',
          'text-yellow-400': match.status === 'PAUSED',
          'text-red-400': match.status === 'COMPLETED',
          'text-blue-400': match.status === 'SCHEDULED',
        }"
      >
        {{
          match.status === 'IN_PROGRESS'
            ? 'LIVE'
            : match.status === 'PAUSED'
              ? 'PAUSED'
              : match.status === 'COMPLETED'
                ? 'FINISHED'
                : 'READY'
        }}
      </p>
    </div>

    <!-- Timer Controls -->
    <div
      class="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-line bg-panel p-6"
    >

      <!-- Start / Resume -->
      <button
        @click="emit('start')"
        :disabled="
          submitting ||
          match.status === 'IN_PROGRESS' ||
          match.status === 'COMPLETED'
        "
        class="rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {{ match.status === 'PAUSED' ? '▶ Resume' : '▶ Start' }}
      </button>

      <!-- Pause -->
      <button
        @click="emit('pause')"
        :disabled="
          submitting ||
          match.status !== 'IN_PROGRESS'
        "
        class="rounded-lg bg-yellow-600 px-6 py-3 font-semibold text-white hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        ⏸ Pause
      </button>

      <!-- Custom Seconds Input -->
      <input
        v-model.number="customSeconds"
        type="number"
        min="1"
        step="1"
        placeholder="Seconds"
        :disabled="
          submitting ||
          match.status !== 'PAUSED'
        "
        class="w-32 rounded-lg border border-line bg-surface px-4 py-3 text-center font-semibold text-foreground outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
      />

      <!-- Decrease Time -->
      <button
        :disabled="
          submitting ||
          match.status !== 'PAUSED' ||
          customTimeDelta === null
        "
        @click="
          customTimeDelta !== null &&
          emit('adjustTime', -customTimeDelta)
        "
        class="rounded-lg bg-red-700 px-5 py-3 font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        − Decrease
      </button>

      <!-- Increase Time -->
      <button
        :disabled="
          submitting ||
          match.status !== 'PAUSED' ||
          customTimeDelta === null
        "
        @click="
          customTimeDelta !== null &&
          emit('adjustTime', customTimeDelta)
        "
        class="rounded-lg bg-green-700 px-5 py-3 font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        + Increase
      </button>
    </div>

    <!-- Main Score Area -->
    <div class="grid grid-cols-1 gap-8 md:grid-cols-2">

      <!-- RED CORNER -->
      <div
        class="rounded-3xl border-4 border-red-600 bg-red-950/30 p-8 text-center"
      >
        <!-- Athlete Photo -->
        <div
          class="mx-auto mb-6 h-40 w-40 overflow-hidden rounded-2xl border-4 border-red-500 shadow-xl"
        >
          <img
            :src="
              match.redAthlete?.photoUrl ||
              '/default-athlete-red.png'
            "
            class="h-full w-full object-cover"
            alt="Red Athlete"
          />
        </div>

        <!-- Athlete Name -->
        <h2 class="mb-4 text-3xl font-bold text-red-100">
          {{ match.redAthlete?.name ?? 'Red Corner' }}
        </h2>

        <!-- Score -->
        <div class="mb-8 text-8xl font-black text-red-400">
          {{ match.redScore ?? 0 }}
        </div>

        <!-- Score Buttons -->
        <div class="space-y-3">
          <button
            v-for="s in scoreTypes"
            :key="s.type"
            class="w-full rounded-2xl bg-red-700 py-5 text-xl font-bold text-white hover:bg-red-600 disabled:opacity-50"
            :disabled="
              submitting ||
              match.status !== 'IN_PROGRESS'
            "
            @click="emit('score', 'RED', s.type)"
          >
            {{ s.label }} (+{{ s.points }})
          </button>
        </div>
      </div>

      <!-- BLUE CORNER -->
      <div
        class="rounded-3xl border-4 border-blue-600 bg-blue-950/30 p-8 text-center"
      >
        <!-- Athlete Photo -->
        <div
          class="mx-auto mb-6 h-40 w-40 overflow-hidden rounded-2xl border-4 border-blue-500 shadow-xl"
        >
          <img
            :src="
              match.blueAthlete?.photoUrl ||
              '/default-athlete-blue.png'
            "
            class="h-full w-full object-cover"
            alt="Blue Athlete"
          />
        </div>

        <!-- Athlete Name -->
        <h2 class="mb-4 text-3xl font-bold text-blue-100">
          {{ match.blueAthlete?.name ?? 'Blue Corner' }}
        </h2>

        <!-- Score -->
        <div class="mb-8 text-8xl font-black text-blue-400">
          {{ match.blueScore ?? 0 }}
        </div>

        <!-- Score Buttons -->
        <div class="space-y-3">
          <button
            v-for="s in scoreTypes"
            :key="s.type"
            class="w-full rounded-2xl bg-blue-700 py-5 text-xl font-bold text-white hover:bg-blue-600 disabled:opacity-50"
            :disabled="
              submitting ||
              match.status !== 'IN_PROGRESS'
            "
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