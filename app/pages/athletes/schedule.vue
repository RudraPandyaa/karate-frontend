<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
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

const filter = ref<'all' | 'live' | 'upcoming' | 'completed'>('all')

onMounted(async () => {
  await fetchDashboard()
})

const athleteId = computed(() => dashboard.value?.athlete?.id || null)

const scheduleMatches = computed(() => {
  const live = dashboard.value?.liveMatches ?? []
  const upcoming = dashboard.value?.upcomingMatches ?? []
  const recent = dashboard.value?.recentMatches ?? []
  return [...live, ...upcoming, ...recent]
})

const filteredMatches = computed(() => {
  const list = scheduleMatches.value
  if (filter.value === 'live') {
    return list.filter(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'PAUSED',
    )
  }
  if (filter.value === 'upcoming') {
    return list.filter((m) => m.status === 'SCHEDULED')
  }
  if (filter.value === 'completed') {
    return list.filter((m) => m.status === 'COMPLETED')
  }
  return list
})

const statusOrder: Record<string, number> = {
  IN_PROGRESS: 0,
  PAUSED: 1,
  SCHEDULED: 2,
  COMPLETED: 3,
}

const groupedByTatami = computed(() => {
  const map = new Map<string, any[]>()

  for (const match of filteredMatches.value) {
    const key = match.tatami
      ? `Tatami ${match.tatami.number}${match.tatami.name ? ` – ${match.tatami.name}` : ''}`
      : 'Unassigned'

    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(match)
  }

  return Array.from(map.entries()).map(([tatami, matches]) => ({
    tatami,
    matches: [...matches].sort(
      (a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9),
    ),
  }))
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

function matchLink(match: any) {
  return `/live-scoring/${match.id}`
}

function scoreText(match: any) {
  if (match.status !== 'COMPLETED' && match.status !== 'IN_PROGRESS' && match.status !== 'PAUSED') {
    return null
  }
  if (match.redAthlete?.id === athleteId.value) {
    return `${match.redScore ?? 0} – ${match.blueScore ?? 0}`
  }
  if (match.blueAthlete?.id === athleteId.value) {
    return `${match.blueScore ?? 0} – ${match.redScore ?? 0}`
  }
  return `${match.redScore ?? 0} – ${match.blueScore ?? 0}`
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Schedule</h1>
      <p class="mt-1 text-sm text-muted">
        Your matches grouped by tatami
      </p>
    </div>

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

    <div
      v-if="pending && !dashboard"
      class="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-12 text-sm text-muted"
    >
      <Loader2 class="h-5 w-5 animate-spin text-blue-400" />
      Loading schedule...
    </div>

    <div
      v-else-if="error"
      class="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
    >
      {{ error }}
    </div>

    <div
      v-else-if="groupedByTatami.length === 0"
      class="rounded-3xl border border-line bg-surface py-16 text-center"
    >
      <h3 class="text-lg font-semibold text-foreground">No scheduled matches</h3>
      <p class="mt-2 text-sm text-muted">
        You don’t have any matches in this filter yet.
      </p>
      <NuxtLink
        to="/athletes/my-categories"
        class="mt-4 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
      >
        Check categories →
      </NuxtLink>
    </div>

    <div v-else class="space-y-6">
      <section
        v-for="group in groupedByTatami"
        :key="group.tatami"
        class="overflow-hidden rounded-3xl border border-line bg-surface"
      >
        <div class="border-b border-line px-5 py-4">
          <h2 class="font-semibold text-foreground">
            {{ group.tatami }}
          </h2>
          <p class="text-sm text-muted">
            {{ group.matches.length }} match{{ group.matches.length === 1 ? '' : 'es' }}
          </p>
        </div>

        <div class="divide-y divide-line">
          <NuxtLink
            v-for="match in group.matches"
            :key="match.id"
            :to="matchLink(match)"
            class="flex flex-col gap-3 px-5 py-4 transition hover:bg-surface-hover sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                  :class="statusClass(match.status)"
                >
                  {{ statusLabel(match.status) }}
                </span>
                <span class="text-xs text-muted">
                  {{ formatRound(match.round) }}
                </span>
              </div>

              <p class="mt-2 font-medium text-foreground">
                {{ match.category?.name || 'Category' }}
              </p>

              <p class="mt-1 text-sm text-muted">
                vs {{ athleteName(getOpponent(match)) }}
              </p>
            </div>

            <div class="text-sm sm:text-right">
              <p
                v-if="scoreText(match)"
                class="font-semibold tabular-nums text-foreground"
              >
                {{ scoreText(match) }}
              </p>
              <p v-else class="text-muted">
                {{ statusLabel(match.status) }}
              </p>
              <p class="mt-1 text-xs text-blue-400">
                View →
              </p>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>