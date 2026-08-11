<script setup lang="ts">
import { onMounted } from 'vue'
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

function formatDiscipline(discipline?: string) {
  if (!discipline) return '—'
  return discipline
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatGender(gender?: string) {
  if (!gender) return '—'
  return gender.charAt(0) + gender.slice(1).toLowerCase()
}

function weightLabel(category: any) {
  if (
    category.discipline === 'KATA' ||
    category.discipline === 'TEAM_KATA'
  ) {
    return '—'
  }

  if (category.weightMin == null && category.weightMax == null) {
    return 'Open'
  }

  if (category.weightMin == null) {
    return `-${category.weightMax} kg`
  }

  if (category.weightMax == null) {
    return `+${category.weightMin} kg`
  }

  return `${category.weightMin}–${category.weightMax} kg`
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">My Categories</h1>
      <p class="mt-1 text-sm text-muted">
        Categories you are enrolled in for this tournament
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
      v-else-if="!dashboard?.categories?.length"
      class="rounded-3xl border border-line bg-surface py-16 text-center"
    >
      <h3 class="text-lg font-semibold text-foreground">No categories yet</h3>
      <p class="mt-2 text-sm text-muted">
        You are not enrolled in any category. Please contact the organizer.
      </p>
    </div>

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <div
        v-for="category in dashboard.categories"
        :key="category.id"
        class="rounded-3xl border border-line bg-surface p-5 transition hover:border-blue-500/30"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h3 class="font-semibold text-foreground">
              {{ category.name }}
            </h3>

            <p
              v-if="category.tournament?.name"
              class="mt-1 text-sm text-muted"
            >
              {{ category.tournament.name }}
            </p>
          </div>

          <span
            v-if="category.seed"
            class="shrink-0 rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400"
          >
            Seed #{{ category.seed }}
          </span>
        </div>

        <div class="mt-5 space-y-3 text-sm">
          <div class="flex items-center justify-between gap-3">
            <span class="text-muted">Discipline</span>
            <span class="font-medium text-foreground">
              {{ formatDiscipline(category.discipline) }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="text-muted">Age Group</span>
            <span class="font-medium text-foreground">
              {{ category.ageGroup || '—' }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="text-muted">Gender</span>
            <span class="font-medium text-foreground">
              {{ formatGender(category.gender) }}
            </span>
          </div>

          <div class="flex items-center justify-between gap-3">
            <span class="text-muted">Weight</span>
            <span class="font-medium text-foreground">
              {{ weightLabel(category) }}
            </span>
          </div>
        </div>

        <div class="mt-5">
          <NuxtLink
            :to="`/brackets/${category.id}`"
            class="inline-flex w-full items-center justify-center rounded-xl border border-line bg-panel px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-hover"
          >
            View Bracket
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>