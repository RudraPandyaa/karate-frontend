<script setup lang="ts">
import { computed, onMounted } from 'vue'
import {
  useRefereeMatches,
} from '~/composables/useRefereeMatches'
import { athleteDisplayName } from '~/composables/useMatches'

definePageMeta({
  layout: 'default',
  middleware: 'referee',
})

const {
  matches,
  pending,
  error,
  fetchAssignedToReferee,
} = useRefereeMatches()

onMounted(() => {
  fetchAssignedToReferee()
})

const activeMatches = computed(() =>
  matches.value.filter((m) =>
    ['SCHEDULED', 'IN_PROGRESS', 'PAUSED'].includes(m.status),
  ),
)

const completedMatches = computed(() =>
  matches.value.filter(
    (m) => m.status === 'COMPLETED',
  ),
)

function statusClass(status: string) {
  if (status === 'IN_PROGRESS') {
    return 'bg-green-500/15 text-green-400'
  }

  if (status === 'PAUSED') {
    return 'bg-yellow-500/15 text-yellow-400'
  }

  if (status === 'COMPLETED') {
    return 'bg-zinc-500/15 text-zinc-300'
  }

  return 'bg-blue-500/15 text-blue-400'
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">My Matches</h1>
      <p class="mt-1 text-sm text-muted">
        Matches assigned to you as referee
      </p>
    </div>

    <div v-if="pending" class="text-muted">Loading matches...</div>
    <div v-else-if="error" class="text-red-400">{{ error }}</div>

    <div v-else-if="matches.length === 0" class="rounded-xl border border-line bg-surface p-8 text-center">
      <p class="text-sm text-muted">No matches assigned yet.</p>
      <p class="mt-2 text-xs text-muted">
        Organizer must assign you as referee on a match.
      </p>
    </div>

    <template v-else>
      <section class="space-y-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
          Active / Upcoming
        </h2>

        <div
          v-for="m in activeMatches"
          :key="m.id"
          class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-bold"
                :class="statusClass(m.status)"
              >
                {{ m.status }}
              </span>
              <span class="text-xs text-muted">{{ m.round }}</span>
            </div>

            <p class="mt-2 font-medium text-foreground">
              {{ athleteDisplayName(m.redAthlete) }}
              vs
              {{ athleteDisplayName(m.blueAthlete) }}
            </p>

            <p class="mt-1 text-sm text-muted">
              {{ m.category?.name || 'Category' }}
              <span v-if="m.tatami"> · Tatami {{ m.tatami.number }}</span>
            </p>
          </div>

          <NuxtLink
            :to="`/scoring-control/${m.id}`"
            class="rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-500"
          >
            Open Match
          </NuxtLink>
        </div>

        <p v-if="activeMatches.length === 0" class="text-sm text-muted">
          No active matches
        </p>
      </section>
    </template>
  </div>
</template>