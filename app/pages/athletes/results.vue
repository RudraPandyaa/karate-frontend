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

const completedMatches = computed(() => {
  return dashboard.value?.recentMatches ?? []
})

const history = computed(() => {
  return dashboard.value?.history ?? []
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

function getResult(match: any) {
  if (!match.winnerId || !athleteId.value) {
    return {
      label: '—',
      score: `${match.redScore ?? 0} - ${match.blueScore ?? 0}`,
      isWin: false,
    }
  }

  const isWin = match.winnerId === athleteId.value
  const score =
    match.redAthlete?.id === athleteId.value
      ? `${match.redScore} - ${match.blueScore}`
      : `${match.blueScore} - ${match.redScore}`

  return {
    label: isWin ? 'WIN' : 'LOSS',
    score,
    isWin,
  }
}

function medalClass(medal?: string | null) {
  if (medal === 'GOLD') return 'text-yellow-400'
  if (medal === 'SILVER') return 'text-gray-300'
  if (medal === 'BRONZE') return 'text-orange-400'
  return 'text-muted'
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-8 px-4 py-6 lg:px-8 lg:py-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">Results</h1>
      <p class="mt-1 text-sm text-muted">
        Your completed matches and championship history
      </p>
    </div>

    <PageLoader v-if="pending" text="Loading your results..." />

    <div
      v-else-if="error"
      class="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
    >
      {{ error }}
    </div>

    <template v-else>
      <!-- Summary -->
      <section class="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div class="rounded-2xl border border-line bg-surface p-4">
          <p class="text-xs uppercase tracking-wide text-muted">Matches</p>
          <p class="mt-2 text-2xl font-bold text-foreground">
            {{ dashboard?.stats?.matches ?? 0 }}
          </p>
        </div>

        <div class="rounded-2xl border border-line bg-surface p-4">
          <p class="text-xs uppercase tracking-wide text-muted">Wins</p>
          <p class="mt-2 text-2xl font-bold text-green-400">
            {{ dashboard?.stats?.wins ?? 0 }}
          </p>
        </div>

        <div class="rounded-2xl border border-line bg-surface p-4">
          <p class="text-xs uppercase tracking-wide text-muted">Losses</p>
          <p class="mt-2 text-2xl font-bold text-red-400">
            {{ dashboard?.stats?.losses ?? 0 }}
          </p>
        </div>

        <div class="rounded-2xl border border-line bg-surface p-4">
          <p class="text-xs uppercase tracking-wide text-muted">Win Rate</p>
          <p class="mt-2 text-2xl font-bold text-foreground">
            {{ dashboard?.stats?.winRate ?? 0 }}%
          </p>
        </div>
      </section>

      <!-- Completed Matches -->
      <section class="rounded-3xl border border-line bg-surface overflow-hidden">
        <div class="border-b border-line px-5 py-4">
          <h2 class="font-semibold text-foreground">Completed Matches</h2>
          <p class="text-sm text-muted">Recent results from this tournament</p>
        </div>

        <div
          v-if="completedMatches.length === 0"
          class="px-5 py-12 text-center text-sm text-muted"
        >
          No completed matches yet
        </div>

        <div v-else class="divide-y divide-line">
          <div
            v-for="match in completedMatches"
            :key="match.id"
            class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-medium text-muted">
                  {{ formatRound(match.round) }}
                </span>
              </div>

              <p class="mt-1 font-medium text-foreground">
                vs {{ athleteName(getOpponent(match)) }}
              </p>

              <p class="mt-1 text-sm text-muted">
                {{ match.category?.name || 'Category' }}
                <span v-if="match.tatami">
                  · Tatami {{ match.tatami.number }}
                </span>
              </p>
            </div>

            <div
              class="shrink-0 rounded-xl px-4 py-2 text-center text-sm font-bold"
              :class="getResult(match).isWin
                ? 'bg-green-500/15 text-green-400'
                : 'bg-red-500/15 text-red-400'"
            >
              {{ getResult(match).label }}
              <div class="text-xs font-medium opacity-80">
                {{ getResult(match).score }}
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Championship History -->
      <section class="rounded-3xl border border-line bg-surface overflow-hidden">
        <div class="border-b border-line px-5 py-4">
          <h2 class="font-semibold text-foreground">Championship History</h2>
          <p class="text-sm text-muted">Past tournament achievements</p>
        </div>

        <div
          v-if="history.length === 0"
          class="px-5 py-12 text-center text-sm text-muted"
        >
          No championship history yet
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-canvas/50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th class="px-5 py-3 font-medium">Year</th>
                <th class="px-5 py-3 font-medium">Tournament</th>
                <th class="px-5 py-3 font-medium">Medal</th>
                <th class="px-5 py-3 font-medium">Position</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in history"
                :key="item.id"
                class="border-t border-line"
              >
                <td class="px-5 py-3 font-medium text-foreground">
                  {{ item.year }}
                </td>
                <td class="px-5 py-3 text-muted">
                  {{ item.tournament?.name || '—' }}
                </td>
                <td class="px-5 py-3">
                  <span
                    class="font-semibold"
                    :class="medalClass(item.medal)"
                  >
                    {{ item.medal || '—' }}
                  </span>
                </td>
                <td class="px-5 py-3 text-muted">
                  {{ item.position ? `#${item.position}` : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>