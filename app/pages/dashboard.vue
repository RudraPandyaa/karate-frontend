<script setup lang="ts">
import { Trophy, Timer, Users, Zap } from 'lucide-vue-next'
import TatamiDashboard from '~/components/tatami/TatamiDashboard.vue'
console.log('DASHBOARD PAGE LOADED')
definePageMeta({
  layout: 'default',
  middleware: 'admin',
})

const { stats, liveMatches, upcomingMatches, usingMockData, pending, fetchAll } = useDashboardData()

// Shared with AppTopbar.vue via the same useState key — typing in the
// header search box filters the upcoming matches list below.
const topbarSearch = useState('topbarSearch', () => '')
const { isStaff } = useAuth()

const handleEditMatch = (match: any) => {
  // TODO: Open edit modal or navigate to edit page
  console.log('Edit match:', match)
  // navigateTo(`/admin/matches/${match.id}/edit`)
}

const createNewMatch = () => {
  // TODO: Open create modal
  console.log('Create new match')
}
const filteredUpcomingMatches = computed(() => {
  const q = topbarSearch.value.trim().toLowerCase()
  if (!q) return upcomingMatches.value
  return upcomingMatches.value.filter(
    (m) =>
      m.categoryName.toLowerCase().includes(q) ||
      m.redAthlete.name.toLowerCase().includes(q) ||
      m.blueAthlete.name.toLowerCase().includes(q),
  )
})
onMounted(() => {
  fetchAll()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Mock-data notice: remove once real endpoints are wired up -->
    <div
      v-if="usingMockData"
      class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300"
    >
      Showing mock data — backend not reachable at the configured API base yet. Update
      <code class="rounded bg-black/30 px-1 py-0.5">NUXT_PUBLIC_API_BASE</code> in your <code class="rounded bg-black/30 px-1 py-0.5">.env</code>
      and confirm the endpoint paths in <code class="rounded bg-black/30 px-1 py-0.5">useDashboardData.ts</code>.
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
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-foreground">Live Tatamis</h2>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-rose-600/15 border border-rose-600/30 px-3 py-1 text-xs font-bold text-rose-400">
          <span class="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse text-white" />
          LIVE BROADCAST
        </span>
      </div>

      <div v-if="pending" class="text-sm text-muted">Loading live tatamis…</div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <DashboardLiveTatamiCard v-for="m in liveMatches" :key="m.id" :match="m" />
      </div>
    </section>

    <!-- Upcoming matches -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold text-foreground">Upcoming Matches</h2>
        <div class="flex items-center gap-4">
          <NuxtLink to="/matches" class="text-sm font-medium text-blue-400 hover:text-blue-300">
            View Full Schedule ›
          </NuxtLink>
        </div>
      </div>

      <DashboardUpcomingMatchesTable 
        :matches="filteredUpcomingMatches" 
        :editable="isStaff"
        @edit="handleEditMatch"
      />
    </section>
  </div>
</template>