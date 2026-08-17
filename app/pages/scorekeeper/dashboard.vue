<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useScorekeeperMatches } from '~/composables/useScorekeeperMatches'
import { athleteDisplayName } from '~/composables/useMatches'

definePageMeta({
  layout: 'scorekeeper',
  middleware: 'scorekeeper',
})

const { user } = useAuth()
const { matches, pending, error, fetchAssignedToScorekeeper } =
  useScorekeeperMatches()

onMounted(() => {
  fetchAssignedToScorekeeper()
  const timer = setInterval(() => fetchAssignedToScorekeeper(), 20000)
  onUnmounted(() => clearInterval(timer))
})

const liveCount = computed(() =>
  matches.value.filter((m) =>
    ['IN_PROGRESS', 'PAUSED'].includes(m.status),
  ).length,
)

const upcomingCount = computed(() =>
  matches.value.filter((m) => m.status === 'SCHEDULED').length,
)

const completedCount = computed(() =>
  matches.value.filter((m) => m.status === 'COMPLETED').length,
)

const nextMatch = computed(() => {
  return (
    matches.value.find((m) =>
      ['IN_PROGRESS', 'PAUSED'].includes(m.status),
    ) ||
    matches.value.find((m) => m.status === 'SCHEDULED') ||
    null
  )
})

function statusLabel(status?: string) {
  if (status === 'IN_PROGRESS') return 'LIVE'
  if (status === 'PAUSED') return 'PAUSED'
  if (status === 'SCHEDULED') return 'UPCOMING'
  return status || '—'
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Scorekeeper Dashboard</h1>
      <p class="mt-1 text-sm text-muted">Welcome, {{ user?.name }}</p>
    </div>

    <div
      v-if="pending && !matches.length"
      class="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-12 text-sm text-muted"
    >
      <Loader2 class="h-5 w-5 animate-spin text-blue-400" />
      Loading dashboard...
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300"
    >
      {{ error }}
    </div>

    <template v-else>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-line bg-surface p-4">
          <p class="text-xs uppercase tracking-wide text-muted">Live / Paused</p>
          <p class="mt-2 text-2xl font-bold text-green-400">{{ liveCount }}</p>
        </div>
        <div class="rounded-xl border border-line bg-surface p-4">
          <p class="text-xs uppercase tracking-wide text-muted">Upcoming</p>
          <p class="mt-2 text-2xl font-bold text-blue-400">{{ upcomingCount }}</p>
        </div>
        <div class="rounded-xl border border-line bg-surface p-4">
          <p class="text-xs uppercase tracking-wide text-muted">Completed</p>
          <p class="mt-2 text-2xl font-bold text-foreground">{{ completedCount }}</p>
        </div>
      </div>

      <div class="rounded-xl border border-line bg-surface p-5">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
          Next / Current Match
        </h2>

        <div v-if="!nextMatch" class="mt-4 text-sm text-muted">
          No assigned match right now.
        </div>

        <div
          v-else
          class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <p class="font-semibold text-foreground">
              {{ athleteDisplayName(nextMatch.redAthlete) }}
              vs
              {{ athleteDisplayName(nextMatch.blueAthlete) }}
            </p>
            <p class="mt-1 text-sm text-muted">
              {{ nextMatch.category?.name || 'Category' }}
              · {{ nextMatch.round }}
              <span v-if="nextMatch.tatami">
                · Tatami {{ nextMatch.tatami.number }}
              </span>
            </p>
            <p class="mt-1 text-xs font-semibold text-blue-400">
              {{ statusLabel(nextMatch.status) }}
              <span v-if="['IN_PROGRESS', 'PAUSED'].includes(nextMatch.status)">
                · {{ nextMatch.redScore ?? 0 }}–{{ nextMatch.blueScore ?? 0 }}
              </span>
            </p>
          </div>

          <NuxtLink
            :to="`/scoring-control/${nextMatch.id}`"
            class="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-500"
          >
            Open Scoring
          </NuxtLink>
        </div>
      </div>

      <div class="flex flex-wrap gap-3">
        <NuxtLink
          to="/scorekeeper/matches"
          class="rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium hover:bg-surface-hover"
        >
          View all matches
        </NuxtLink>
        <NuxtLink
          to="/scorekeeper/results"
          class="rounded-xl border border-line bg-surface px-4 py-3 text-sm font-medium hover:bg-surface-hover"
        >
          Results
        </NuxtLink>
      </div>
    </template>
  </div>
</template>