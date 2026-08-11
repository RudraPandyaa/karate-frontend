<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'
import NextMatchCard from '~/components/athletes/NextMatchCard.vue'
import AthleteQuickStats from '~/components/athletes/AthleteQuickStats.vue'
import TodayMatches from '~/components/athletes/TodayMatches.vue'
import MyCategories from '~/components/athletes/MyCategories.vue'
import KarateLoader from '~/components/ui/KarateLoader.vue'
definePageMeta({
  layout: 'athlete',
  middleware: ['athlete'],
})

const { user } = useAuth()

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

const nextMatch = computed(() => {
  // Prefer live/paused match first, then first upcoming
  const live = dashboard.value?.liveMatches?.[0]
  if (live) return live
  return dashboard.value?.upcomingMatches?.[0] || null
})

const todayMatches = computed(() => {
  const live = dashboard.value?.liveMatches ?? []
  const upcoming = dashboard.value?.upcomingMatches ?? []
  const recent = dashboard.value?.recentMatches ?? []

  // Show a useful mix: live + upcoming + recent
  return [...live, ...upcoming, ...recent].slice(0, 8)
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">

    <!-- Welcome -->
    <section class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium text-blue-400">
          Athlete Portal
        </p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {{ dashboard?.athlete?.fullName || user?.name || 'Athlete' }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          ID:
          <span class="font-mono text-foreground">
            {{ dashboard?.athlete?.id?.slice(0, 8)?.toUpperCase() || '—' }}
          </span>
          <span v-if="dashboard?.athlete?.country">
            · {{ dashboard.athlete.country }}
          </span>
        </p>
      </div>
    </section>

    <!-- Loading -->
    <div
      v-if="pending"
      class="rounded-3xl border border-line bg-surface py-16 text-center text-muted"
    >
      <KarateLoader text="Loading your athlete dashboard..." />
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
    >
      {{ error }}
    </div>

    <!-- Content -->
    <template v-else>
      <!-- Next Match -->
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground">Next Match</h2>
        </div>

        <NextMatchCard
          :match="nextMatch"
          :athlete-id="athleteId"
        />
      </section>

      <!-- Stats -->
      <section>
        <AthleteQuickStats
          :stats="dashboard?.stats"
          :upcoming-count="dashboard?.upcomingMatches?.length ?? 0"
          :categories-count="dashboard?.categories?.length ?? 0"
        />
      </section>

      <!-- Bottom grid -->
      <section class="grid gap-6 lg:grid-cols-5">
        <div class="lg:col-span-3">
          <TodayMatches
            :matches="todayMatches"
            :athlete-id="athleteId"
          />
        </div>

        <div class="lg:col-span-2">
          <MyCategories
            :categories="dashboard?.categories ?? []"
          />
        </div>
      </section>
    </template>
  </div>
</template>