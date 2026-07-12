<script setup lang="ts">
import { Trophy, Timer, Users, Zap } from 'lucide-vue-next'

const { stats, liveMatches, upcomingMatches, usingMockData, pending, fetchAll } = useDashboardData()

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
        value="01"
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
        <h2 class="text-xl font-bold text-white">Live Tatamis</h2>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-rose-600/15 border border-rose-600/30 px-3 py-1 text-xs font-bold text-rose-400">
          <span class="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
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
        <h2 class="text-xl font-bold text-white">Upcoming Matches</h2>
        <NuxtLink to="/matches" class="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
          View Full Schedule ›
        </NuxtLink>
      </div>

      <DashboardUpcomingMatchesTable :matches="upcomingMatches" />
    </section>
  </div>
</template>