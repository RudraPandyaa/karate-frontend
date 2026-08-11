<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageLoader from '~/components/ui/PageLoader.vue'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'

definePageMeta({
  layout: 'athlete',
  middleware: ['athlete'],
})

const {
  dashboard,
  pending,
  error,
  fetchDashboard,
} = useAthleteDashboard()

const filter = ref<'all' | 'upcoming' | 'live' | 'completed'>('all')

onMounted(async () => {
  await fetchDashboard()
})

const athleteId = computed(() => dashboard.value?.athlete?.id || null)

const allMatches = computed(() => {
  const live = dashboard.value?.liveMatches ?? []
  const upcoming = dashboard.value?.upcomingMatches ?? []
  const recent = dashboard.value?.recentMatches ?? []
  return [...live, ...upcoming, ...recent]
})

const filteredMatches = computed(() => {
  if (filter.value === 'upcoming') {
    return dashboard.value?.upcomingMatches ?? []
  }
  if (filter.value === 'live') {
    return dashboard.value?.liveMatches ?? []
  }
  if (filter.value === 'completed') {
    return dashboard.value?.recentMatches ?? []
  }
  return allMatches.value
})

function athleteName(athlete?: any) {
  if (!athlete) return 'TBD'
  return (
    athlete.fullName ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}

function getOpponent(match: any) {
  if (!athleteId.value) return match.blueAthlete || match.redAthlete
  if (match.redAthlete?.id === athleteId.value) return match.blueAthlete
  return match.redAthlete
}

function formatRound(round?: string) {
  if (!round) return 'Match'
  return round
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function statusLabel(status?: string) {
  if (status === 'IN_PROGRESS') return 'LIVE'
  if (status === 'PAUSED') return 'PAUSED'
  if (status === 'SCHEDULED') return 'UPCOMING'
  if (status === 'COMPLETED') return 'FINISHED'
  return status || '—'
}

function statusClass(status?: string) {
  if (status === 'IN_PROGRESS') return 'bg-green-500/15 text-green-400'
  if (status === 'PAUSED') return 'bg-yellow-500/15 text-yellow-400'
  if (status === 'COMPLETED') return 'bg-zinc-500/15 text-zinc-300'
  return 'bg-blue-500/15 text-blue-400'
}

function getResult(match: any) {
  if (match.status !== 'COMPLETED' || !match.winnerId || !athleteId.value) {
    return null
  }

  const isWin = match.winnerId === athleteId.value
  const score =
    match.redAthlete?.id === athleteId.value
      ? `${match.redScore} - ${match.blueScore}`
      : `${match.blueScore} - ${match.redScore}`

  return { isWin, score }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">My Matches</h1>
        <p class="mt-1 text-sm text-muted">
          All your scheduled, live and completed matches
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-2">
      <button
        v-for="item in [
          { key: 'all', label: 'All' },
          { key: 'live', label: 'Live' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
        ]"
        :key="item.key"
        class="rounded-xl border px-4 py-2 text-sm font-medium transition"
        :class="filter === item.key
          ? 'border-blue-500 bg-blue-600/15 text-blue-400'
          : 'border-line bg-surface text-muted hover:bg-surface-hover hover:text-foreground'"
        @click="filter = item.key as any"
      >
        {{ item.label }}
      </button>
    </div>

    <!-- Loading -->
    <PageLoader v-if="pending" text="Loading your matches..." />

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
    >
      {{ error }}
    </div>

    <!-- Empty -->
    <div
      v-else-if="filteredMatches.length === 0"
      class="rounded-3xl border border-line bg-surface py-16 text-center"
    >
      <h3 class="text-lg font-semibold text-foreground">No matches found</h3>
      <p class="mt-2 text-sm text-muted">
        You don’t have any matches in this filter yet.
      </p>
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div
        v-for="match in filteredMatches"
        :key="match.id"
        class="rounded-2xl border border-line bg-surface p-5 transition hover:border-blue-500/30"
      >
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                :class="statusClass(match.status)"
              >
                {{ statusLabel(match.status) }}
              </span>

              <span class="text-xs font-medium text-muted">
                {{ formatRound(match.round) }}
              </span>
            </div>

            <h3 class="mt-2 font-semibold text-foreground">
              {{ match.category?.name || 'Category' }}
            </h3>

            <p class="mt-1 text-sm text-muted">
              vs {{ athleteName(getOpponent(match)) }}
            </p>

            <p v-if="match.tatami" class="mt-1 text-sm text-muted">
              Tatami {{ match.tatami.number }}
              <span v-if="match.tatami.name">
                · {{ match.tatami.name }}
              </span>
            </p>
          </div>

          <div class="shrink-0">
            <template v-if="getResult(match)">
              <div
                class="rounded-xl px-4 py-2 text-center text-sm font-bold"
                :class="getResult(match)?.isWin
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-red-500/15 text-red-400'"
              >
                {{ getResult(match)?.isWin ? 'WIN' : 'LOSS' }}
                <div class="text-xs font-medium opacity-80">
                  {{ getResult(match)?.score }}
                </div>
              </div>
            </template>

            <div
              v-else
              class="rounded-xl bg-surface-hover px-4 py-2 text-center text-sm font-semibold text-muted"
            >
              {{ statusLabel(match.status) }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>