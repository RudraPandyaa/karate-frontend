<script setup lang="ts">
import { onMounted } from 'vue'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'
import PageLoader from '~/components/ui/PageLoader.vue'
definePageMeta({
  layout: 'athlete',
  middleware: ['athlete'],
})

const { user, logout } = useAuth()

const {
  dashboard,
  pending,
  error,
  fetchDashboard,
} = useAthleteDashboard()

onMounted(async () => {
  await fetchDashboard()
})

function displayValue(value?: string | null) {
  return value && String(value).trim() ? value : '—'
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">My Profile</h1>
      <p class="mt-1 text-sm text-muted">
        Your athlete account details
      </p>
    </div>

    <PageLoader v-if="pending" text="Loading your profile..." />

    <div
      v-else-if="error"
      class="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
    >
      {{ error }}
    </div>

    <template v-else>
      <!-- Header card -->
      <section class="rounded-3xl border border-line bg-surface p-6">
        <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-line bg-blue-600 text-2xl font-bold text-white">
              <img
                v-if="dashboard?.athlete?.photoUrl"
                :src="dashboard.athlete.photoUrl"
                class="h-full w-full object-cover"
              />
              <span v-else>
                {{
                  (dashboard?.athlete?.fullName || user?.name || 'A')
                    .charAt(0)
                    .toUpperCase()
                }}
              </span>
            </div>

            <div>
              <h2 class="text-xl font-bold text-foreground">
                {{ dashboard?.athlete?.fullName || user?.name || 'Athlete' }}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ displayValue(dashboard?.athlete?.email || user?.email) }}
              </p>
              <p class="mt-1 font-mono text-xs text-blue-400">
                ID: {{ dashboard?.athlete?.id?.slice(0, 10)?.toUpperCase() || '—' }}
              </p>
            </div>
          </div>

          <button
            class="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </section>

      <!-- Details -->
      <section class="grid gap-6 lg:grid-cols-2">
        <!-- Personal -->
        <div class="rounded-3xl border border-line bg-surface p-6">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Personal Information
          </h3>

          <div class="space-y-4 text-sm">
            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">Full Name</span>
              <span class="font-medium text-foreground text-right">
                {{ displayValue(dashboard?.athlete?.fullName) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">Email</span>
              <span class="font-medium text-foreground text-right">
                {{ displayValue(dashboard?.athlete?.email || user?.email) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">Country</span>
              <span class="font-medium text-foreground text-right">
                {{ displayValue(dashboard?.athlete?.country) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">State</span>
              <span class="font-medium text-foreground text-right">
                {{ displayValue(dashboard?.athlete?.state) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">City</span>
              <span class="font-medium text-foreground text-right">
                {{ displayValue(dashboard?.athlete?.city) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Karate Info -->
        <div class="rounded-3xl border border-line bg-surface p-6">
          <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
            Karate Information
          </h3>

          <div class="space-y-4 text-sm">
            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">Current Rank</span>
              <span class="font-medium text-foreground text-right">
                {{ displayValue(dashboard?.athlete?.currentRank) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">Style</span>
              <span class="font-medium text-foreground text-right">
                {{ displayValue(dashboard?.athlete?.style) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">Dojo</span>
              <span class="font-medium text-foreground text-right">
                {{ displayValue(dashboard?.athlete?.dojo?.name) }}
              </span>
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-muted">Coach</span>
              <span class="font-medium text-foreground text-right">
                {{
                  dashboard?.athlete?.coach
                    ? [dashboard.athlete.coach.firstName, dashboard.athlete.coach.lastName]
                        .filter(Boolean)
                        .join(' ')
                    : '—'
                }}
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick stats -->
      <section class="rounded-3xl border border-line bg-surface p-6">
        <h3 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Competition Summary
        </h3>

        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div class="rounded-2xl bg-canvas px-4 py-3">
            <p class="text-xs text-muted">Matches</p>
            <p class="mt-1 text-xl font-bold text-foreground">
              {{ dashboard?.stats?.matches ?? 0 }}
            </p>
          </div>

          <div class="rounded-2xl bg-canvas px-4 py-3">
            <p class="text-xs text-muted">Wins</p>
            <p class="mt-1 text-xl font-bold text-green-400">
              {{ dashboard?.stats?.wins ?? 0 }}
            </p>
          </div>

          <div class="rounded-2xl bg-canvas px-4 py-3">
            <p class="text-xs text-muted">Losses</p>
            <p class="mt-1 text-xl font-bold text-red-400">
              {{ dashboard?.stats?.losses ?? 0 }}
            </p>
          </div>

          <div class="rounded-2xl bg-canvas px-4 py-3">
            <p class="text-xs text-muted">Win Rate</p>
            <p class="mt-1 text-xl font-bold text-foreground">
              {{ dashboard?.stats?.winRate ?? 0 }}%
            </p>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>