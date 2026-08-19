<script setup lang="ts">

import { Trophy, Timer, Users, Zap } from 'lucide-vue-next'
import PageLoader from '~/components/ui/PageLoader.vue'
import TatamiDashboard from '~/components/tatami/TatamiDashboard.vue'

console.log('DASHBOARD PAGE LOADED')

definePageMeta({
  layout: 'default',
  middleware: 'admin',
})

const { stats, liveMatches, upcomingMatches, usingMockData, pending, fetchAll } = useDashboardData()

const topbarSearch = useState('topbarSearch', () => '')
const { isStaff } = useAuth()

const loading = ref(true)

const handleEditMatch = (match: { id: string }) => {
  navigateTo(`/scoring-control/${match.id}`)
}
// const createNewMatch = () => {
//   console.log('Create new match')
// }

const filteredUpcomingMatches = computed(() => {
  const q = topbarSearch.value.trim().toLowerCase()
  if (!q) return upcomingMatches.value

  return upcomingMatches.value.filter((m) => {
    const red =
      m.redAthlete?.name ||
      m.redAthlete?.fullName ||
      ''
    const blue =
      m.blueAthlete?.name ||
      m.blueAthlete?.fullName ||
      ''
    const cat = m.categoryName || ''

    return (
      cat.toLowerCase().includes(q) ||
      red.toLowerCase().includes(q) ||
      blue.toLowerCase().includes(q) ||
      m.round?.toLowerCase().includes(q) ||
      m.matchNo?.toLowerCase().includes(q)
    )
  })
})
onMounted(async () => {
  try {
    await fetchAll()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-6 relative min-h-[60vh]">
    <!-- Your PageLoader -->
    <PageLoader v-if="loading" text="Loading dashboard…" />

    <!-- Content (only shown after loading finishes) -->
    <div v-else>
      <!-- Mock-data notice -->
      <div
        v-if="usingMockData"
        class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300 mb-6"
      >
        Showing mock data — backend not reachable at the configured API base yet. Update
        <code class="rounded bg-black/30 px-1 py-0.5">NUXT_PUBLIC_API_BASE</code> in your
        <code class="rounded bg-black/30 px-1 py-0.5">.env</code>
        and confirm the endpoint paths in
        <code class="rounded bg-black/30 px-1 py-0.5">useDashboardData.ts</code>.
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardStatCard
          label="Total Tournaments"
          :value="stats.totalTournaments"
          :icon="Trophy"
          :trend-pct="stats.totalTournamentsDeltaPct"
          footnote="from last season"
        />
        <DashboardStatCard
          label="Active Tournament"
          :value="String(stats.activeTournamentsCount).padStart(2, '0')"
          :icon="Timer"
          :footnote="stats.activeTournamentName ?? 'No active tournament'"
        />
        <DashboardStatCard
          label="Total Athletes"
          :value="stats.totalAthletes.toLocaleString()"
          :icon="Users"
          footnote="Verified registrations"
        />
        <DashboardStatCard
          label="Running Matches"
          :value="String(stats.runningMatches).padStart(2, '0')"
          :icon="Zap"
          footnote="Live across all tatamis"
        />
      </div>

      <!-- Live tatamis -->
      <section class="mt-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-foreground">Live Tatamis</h2>
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-rose-600/15 border border-rose-600/30 px-3 py-1 text-xs font-bold text-rose-400"
          >
            <span class="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
            LIVE BROADCAST
          </span>
        </div>

        <div v-if="liveMatches.length === 0" class="text-sm text-muted-foreground py-8 text-center">
          No live matches at the moment
        </div>
        <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <DashboardLiveTatamiCard
            v-for="m in liveMatches"
            :key="m.id"
            :match="m"
          />
        </div>
      </section>

      <!-- Upcoming matches -->
      <section class="mt-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-foreground">Upcoming Matches</h2>
          <NuxtLink
            to="/matches"
            class="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            View Full Schedule ›
          </NuxtLink>
        </div>

        <DashboardUpcomingMatchesTable
          :matches="filteredUpcomingMatches"
          :editable="isStaff"
          @edit="handleEditMatch"
        />
      </section>
    </div>
  </div>
</template>