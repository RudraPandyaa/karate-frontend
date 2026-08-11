<script setup lang="ts">
import type { AthleteDashboardMatch } from '~/composables/useAthleteDashboard'

const props = defineProps<{
  matches: AthleteDashboardMatch[]
  athleteId?: string | null
}>()

function athleteName(athlete?: any) {
  if (!athlete) return 'TBD'
  return (
    athlete.fullName ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}

function formatRound(round?: string) {
  if (!round) return 'Match'
  return round
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function getOpponent(match: AthleteDashboardMatch) {
  if (!props.athleteId) {
    return match.blueAthlete || match.redAthlete
  }

  if (match.redAthlete?.id === props.athleteId) {
    return match.blueAthlete
  }

  return match.redAthlete
}

function getResult(match: AthleteDashboardMatch) {
  if (match.status !== 'COMPLETED' || !match.winnerId || !props.athleteId) {
    return null
  }

  const isWin = match.winnerId === props.athleteId
  const score =
    match.redAthlete?.id === props.athleteId
      ? `${match.redScore} - ${match.blueScore}`
      : `${match.blueScore} - ${match.redScore}`

  return {
    isWin,
    score,
  }
}

function statusLabel(status?: string) {
  if (status === 'IN_PROGRESS') return 'LIVE'
  if (status === 'PAUSED') return 'PAUSED'
  if (status === 'SCHEDULED') return 'UPCOMING'
  if (status === 'COMPLETED') return 'FINISHED'
  return status || '—'
}

function statusClass(status?: string) {
  if (status === 'IN_PROGRESS') return 'text-green-400'
  if (status === 'PAUSED') return 'text-yellow-400'
  if (status === 'COMPLETED') return 'text-muted'
  return 'text-blue-400'
}
</script>

<template>
  <div class="rounded-3xl border border-line bg-surface">
    <div class="flex items-center justify-between border-b border-line px-5 py-4">
      <div>
        <h3 class="font-semibold text-foreground">Today’s Matches</h3>
        <p class="text-sm text-muted">Your matches for today</p>
      </div>

      <NuxtLink
        to="/athletes/matches"
        class="text-sm font-medium text-blue-400 hover:text-blue-300"
      >
        View all
      </NuxtLink>
    </div>

    <div v-if="!matches.length" class="px-5 py-10 text-center text-sm text-muted">
      No matches found
    </div>

    <div v-else class="divide-y divide-line">
      <div
        v-for="match in matches"
        :key="match.id"
        class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-muted">
              {{ formatRound(match.round) }}
            </span>

            <span
              class="text-xs font-semibold"
              :class="statusClass(match.status)"
            >
              {{ statusLabel(match.status) }}
            </span>
          </div>

          <p class="mt-1 truncate font-medium text-foreground">
            vs {{ athleteName(getOpponent(match)) }}
          </p>

          <p class="mt-1 text-sm text-muted">
            {{ match.category?.name || 'Category' }}
            <span v-if="match.tatami">
              · Tatami {{ match.tatami.number }}
            </span>
          </p>
        </div>

        <div class="shrink-0">
          <template v-if="getResult(match)">
            <span
              class="rounded-lg px-3 py-1.5 text-xs font-bold"
              :class="getResult(match)?.isWin
                ? 'bg-green-500/15 text-green-400'
                : 'bg-red-500/15 text-red-400'"
            >
              {{ getResult(match)?.isWin ? 'WIN' : 'LOSS' }}
              {{ getResult(match)?.score }}
            </span>
          </template>

          <span
            v-else
            class="rounded-lg bg-surface-hover px-3 py-1.5 text-xs font-semibold text-muted"
          >
            {{ statusLabel(match.status) }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>