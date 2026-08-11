<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'
import PageLoader from '~/components/ui/PageLoader.vue'
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

const groupedByTatami = computed(() => {
  const map = new Map<string, any[]>()

  for (const match of scheduleMatches.value) {
    const key = match.tatami
      ? `Tatami ${match.tatami.number}${match.tatami.name ? ` – ${match.tatami.name}` : ''}`
      : 'Unassigned'

    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(match)
  }

  return Array.from(map.entries()).map(([tatami, matches]) => ({
    tatami,
    matches,
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
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Schedule</h1>
      <p class="mt-1 text-sm text-muted">
        Your matches grouped by tatami
      </p>
    </div>

    <PageLoader v-if="pending" text="Loading your matches..." />

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
        You don’t have any matches assigned yet.
      </p>
    </div>

    <div v-else class="space-y-6">
      <section
        v-for="group in groupedByTatami"
        :key="group.tatami"
        class="rounded-3xl border border-line bg-surface overflow-hidden"
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
          <div
            v-for="match in group.matches"
            :key="match.id"
            class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
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

            <div class="text-sm text-muted sm:text-right">
              <p v-if="match.status === 'COMPLETED'">
                Score:
                {{
                  match.redAthlete?.id === athleteId
                    ? `${match.redScore} - ${match.blueScore}`
                    : `${match.blueScore} - ${match.redScore}`
                }}
              </p>
              <p v-else>
                {{ statusLabel(match.status) }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>