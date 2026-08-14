<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'

definePageMeta({
  layout: 'athlete',
  middleware: ['athlete'],
})

const { api } = useApi()

const {
  dashboard,
  pending,
  error,
  fetchDashboard,
} = useAthleteDashboard()

/** My matches only vs all tournament matches */
const scope = ref<'mine' | 'all'>('mine')
const filter = ref<'all' | 'upcoming' | 'live' | 'completed'>('all')

const allTournamentMatches = ref<any[]>([])
const loadingAll = ref(false)
const allError = ref<string | null>(null)

onMounted(async () => {
  await fetchDashboard()
})

const athleteId = computed(() => dashboard.value?.athlete?.id || null)

async function fetchAllMatches() {
  loadingAll.value = true
  allError.value = null
  try {
    allTournamentMatches.value = await api<any[]>('/matches')
  } catch (err: any) {
    allError.value =
      err?.data?.message || err?.message || 'Failed to load matches'
    allTournamentMatches.value = []
  } finally {
    loadingAll.value = false
  }
}

watch(scope, async (value) => {
  if (value === 'all' && allTournamentMatches.value.length === 0) {
    await fetchAllMatches()
  }
})

function matchAction(match: any) {
  if (match.status === 'IN_PROGRESS' || match.status === 'PAUSED') {
    return { label: 'Watch Live', to: `/live-scoring/${match.id}` }
  }
  if (match.status === 'COMPLETED') {
    return { label: 'View Result', to: `/live-scoring/${match.id}` }
  }
  return null
}

const myMatches = computed(() => {
  const live = dashboard.value?.liveMatches ?? []
  const upcoming = dashboard.value?.upcomingMatches ?? []
  const recent = dashboard.value?.recentMatches ?? []
  return [...live, ...upcoming, ...recent]
})

const baseList = computed(() => {
  if (scope.value === 'all') return allTournamentMatches.value
  return myMatches.value
})

const filteredMatches = computed(() => {
  const list = baseList.value

  if (filter.value === 'upcoming') {
    return list.filter((m) => m.status === 'SCHEDULED')
  }
  if (filter.value === 'live') {
    return list.filter(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'PAUSED',
    )
  }
  if (filter.value === 'completed') {
    return list.filter((m) => m.status === 'COMPLETED')
  }
  return list
})

const isLoading = computed(() => {
  if (scope.value === 'all') return loadingAll.value
  return pending.value
})

const pageError = computed(() => {
  if (scope.value === 'all') return allError.value
  return error.value
})

function athleteName(athlete?: any) {
  if (!athlete) return 'TBD'
  return (
    athlete.fullName ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    athlete.name ||
    'TBD'
  )
}

function getOpponent(match: any) {
  if (!athleteId.value) return match.blueAthlete || match.redAthlete
  if (match.redAthlete?.id === athleteId.value) return match.blueAthlete
  if (match.blueAthlete?.id === athleteId.value) return match.redAthlete
  // All-matches view: show red vs blue headline instead
  return null
}

function matchHeadline(match: any) {
  const opponent = getOpponent(match)
  if (opponent) return `vs ${athleteName(opponent)}`
  return `${athleteName(match.redAthlete)} vs ${athleteName(match.blueAthlete)}`
}

function isMyMatch(match: any) {
  if (!athleteId.value) return false
  return (
    match.redAthlete?.id === athleteId.value ||
    match.blueAthlete?.id === athleteId.value
  )
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
  if (!isMyMatch(match)) {
    // Still show score for all-matches view
    return {
      isWin: null as boolean | null,
      score: `${match.redScore ?? 0} - ${match.blueScore ?? 0}`,
    }
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
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Matches</h1>
        <p class="mt-1 text-sm text-muted">
          Your matches and full tournament schedule
        </p>
      </div>

      <!-- Scope: My vs All -->
      <div class="relative">
        <select
          v-model="scope"
          class="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-foreground outline-none focus:border-blue-600"
        >
          <option value="mine">My Matches</option>
          <option value="all">All Matches</option>
        </select>
      </div>
    </div>

    <!-- Status filters -->
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

    <!-- Compact loading -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-12 text-sm text-muted"
    >
      <Loader2 class="h-5 w-5 animate-spin text-blue-400" />
      Loading matches...
    </div>

    <div
      v-else-if="pageError"
      class="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
    >
      {{ pageError }}
    </div>

    <div
      v-else-if="filteredMatches.length === 0"
      class="rounded-3xl border border-line bg-surface py-16 text-center"
    >
      <h3 class="text-lg font-semibold text-foreground">No matches found</h3>
      <p class="mt-2 text-sm text-muted">
        {{
          scope === 'mine'
            ? 'You don’t have any matches in this filter yet.'
            : 'No tournament matches in this filter yet.'
        }}
      </p>
    </div>

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

              <span
                v-if="scope === 'all' && isMyMatch(match)"
                class="rounded-full bg-blue-600/15 px-2.5 py-1 text-xs font-bold text-blue-400"
              >
                YOU
              </span>

              <span class="text-xs font-medium text-muted">
                {{ formatRound(match.round) }}
              </span>
            </div>

            <h3 class="mt-2 font-semibold text-foreground">
              {{ match.category?.name || 'Category' }}
            </h3>

            <p class="mt-1 text-sm text-muted">
              {{ matchHeadline(match) }}
            </p>

            <p v-if="match.tatami" class="mt-1 text-sm text-muted">
              Tatami {{ match.tatami.number }}
              <span v-if="match.tatami.name">
                · {{ match.tatami.name }}
              </span>
            </p>
          </div>

          <div class="flex shrink-0 flex-col items-end gap-2">
            <!-- Clickable result / score → live-scoring -->
            <NuxtLink
              v-if="getResult(match)"
              :to="`/live-scoring/${match.id}`"
              class="rounded-xl px-4 py-2 text-center text-sm font-bold transition hover:opacity-90"
              :class="getResult(match)?.isWin === true
                ? 'bg-green-500/15 text-green-400'
                : getResult(match)?.isWin === false
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-surface-hover text-foreground'"
            >
              <template v-if="getResult(match)?.isWin === true">WIN</template>
              <template v-else-if="getResult(match)?.isWin === false">LOSS</template>
              <template v-else>SCORE</template>
              <div class="text-xs font-medium opacity-80">
                {{ getResult(match)?.score }}
              </div>
            </NuxtLink>

            <div
              v-else
              class="rounded-xl bg-surface-hover px-4 py-2 text-center text-sm font-semibold text-muted"
            >
              {{ statusLabel(match.status) }}
            </div>

            <NuxtLink
              v-if="matchAction(match)"
              :to="matchAction(match)!.to"
              class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              {{ matchAction(match)!.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>