<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Loader2, Tags, Swords, User } from 'lucide-vue-next'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'
import NextMatchCard from '~/components/athletes/NextMatchCard.vue'
import AthleteQuickStats from '~/components/athletes/AthleteQuickStats.vue'
import TodayMatches from '~/components/athletes/TodayMatches.vue'
import MyCategories from '~/components/athletes/MyCategories.vue'

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

const displayName = computed(
  () => dashboard.value?.athlete?.fullName || user.value?.name || 'Athlete',
)

const nextMatch = computed(() => {
  const live = dashboard.value?.liveMatches?.[0]
  if (live) return live
  return dashboard.value?.upcomingMatches?.[0] || null
})

const todayMatches = computed(() => {
  const live = dashboard.value?.liveMatches ?? []
  const upcoming = dashboard.value?.upcomingMatches ?? []
  const recent = dashboard.value?.recentMatches ?? []
  return [...live, ...upcoming, ...recent].slice(0, 8)
})

const categories = computed(() => dashboard.value?.categories ?? [])
const hasCategories = computed(() => categories.value.length > 0)
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
    <!-- Welcome (always visible) -->
    <section class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p class="text-sm font-medium text-blue-400">Athlete Portal</p>
        <h1 class="mt-1 text-3xl font-bold tracking-tight text-foreground">
          Welcome back, {{ displayName }}
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

      <!-- Quick actions -->
      <!-- <div class="flex flex-wrap gap-2">
        <NuxtLink
          to="/athletes/matches"
          class="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover"
        >
          <Swords class="h-4 w-4 text-blue-400" />
          Matches
        </NuxtLink>
        <NuxtLink
          to="/athletes/my-categories"
          class="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover"
        >
          <Tags class="h-4 w-4 text-blue-400" />
          Categories
        </NuxtLink>
        <NuxtLink
          to="/athletes/profile"
          class="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-hover"
        >
          <User class="h-4 w-4 text-blue-400" />
          Profile
        </NuxtLink>
      </div> -->
    </section>

    <!-- Compact loading (not full-page takeover after welcome) -->
    <div
      v-if="pending"
      class="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-16 text-sm text-muted"
    >
      <Loader2 class="h-5 w-5 animate-spin text-blue-400" />
      Loading your dashboard...
    </div>

    <div
      v-else-if="error"
      class="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
    >
      {{ error }}
    </div>

    <template v-else>
      <!-- No categories CTA -->
      <section
        v-if="!hasCategories"
        class="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5"
      >
        <h2 class="font-semibold text-foreground">
          You are not enrolled in any category yet
        </h2>
        <p class="mt-1 text-sm text-muted">
          Register for a tournament category to appear in brackets and matches.
        </p>
        <NuxtLink
          to="/athletes/my-categories"
          class="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Register for a category
        </NuxtLink>
      </section>

      <!-- Next Match -->
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-foreground">Next Match</h2>
          <NuxtLink
            to="/athletes/matches"
            class="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            All matches →
          </NuxtLink>
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
          :categories-count="categories.length"
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
          <MyCategories :categories="categories" />
        </div>
      </section>
    </template>
  </div>
</template>