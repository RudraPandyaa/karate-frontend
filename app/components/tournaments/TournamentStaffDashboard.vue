<script setup lang="ts">
import {
  Trophy,
  Clock,
  PlayCircle,
  CheckCircle2,
  PauseCircle,
  AlertCircle,
} from 'lucide-vue-next'

import type { Tournament, Match, MatchStatus } from '~/types'

const props = defineProps<{
  tournament: Tournament | null
  matches: Match[]
  isAdmin: boolean
}>()

defineEmits<{ 'assign-officials': [match: Match] }>()

const scheduled = computed(() =>
  props.matches.filter((m) => m.status === 'SCHEDULED').length
)

const live = computed(() =>
  props.matches.filter((m) => m.status === 'IN_PROGRESS').length
)

const completed = computed(() =>
  props.matches.filter((m) => m.status === 'COMPLETED').length
)

const paused = computed(() =>
  props.matches.filter((m) => m.status === 'PAUSED').length
)

const cards = computed(() => [
  {
    title: 'Total Matches',
    value: props.matches.length,
    icon: Trophy,
    color: 'text-blue-400',
  },
  {
    title: 'Scheduled',
    value: scheduled.value,
    icon: Clock,
    color: 'text-yellow-400',
  },
  {
    title: 'Live',
    value: live.value,
    icon: PlayCircle,
    color: 'text-green-400',
  },
  {
    title: 'Completed',
    value: completed.value,
    icon: CheckCircle2,
    color: 'text-emerald-400',
  },
  {
    title: 'Paused',
    value: paused.value,
    icon: PauseCircle,
    color: 'text-orange-400',
  },
])

// Local badge for MatchStatus — StatusBadge.vue is typed for
// TournamentDisplayStatus only; reusing it here would hit the same
// unmatched-value-falls-through-red bug we fixed on the tournaments list.
const matchStatusMeta: Record<MatchStatus, { label: string; class: string }> = {
  SCHEDULED: { label: 'Scheduled', class: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' },
  IN_PROGRESS: { label: 'Live', class: 'bg-green-500/15 text-green-400 border border-green-500/30' },
  PAUSED: { label: 'Paused', class: 'bg-orange-500/15 text-orange-400 border border-orange-500/30' },
  COMPLETED: { label: 'Completed', class: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' },
  CANCELLED: { label: 'Cancelled', class: 'bg-red-500/15 text-red-400 border border-red-500/30' },
}

function athleteName(
  a?: {
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
  } | null,
) {
  if (!a) return 'TBD'
  return (
    a.fullName ||
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}
</script>

<template>
  <div class="space-y-8">
    <!-- Dashboard Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
      <div
        v-for="card in cards"
        :key="card.title"
        class="rounded-3xl border border-line bg-surface p-6"
      >
        <div class="flex justify-between items-start">
          <component :is="card.icon" class="w-8 h-8" :class="card.color" />

          <div class="text-right">
            <div class="text-3xl font-bold">
              {{ card.value }}
            </div>

            <div class="text-muted text-sm mt-1">
              {{ card.title }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tournament Info -->
    <div class="rounded-3xl border border-line bg-surface p-8">
      <h2 class="text-xl font-bold mb-6">
        Tournament Information
      </h2>

      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <p class="text-muted text-sm">
            Tournament Name
          </p>

          <p class="font-semibold mt-1">
            {{ tournament?.name }}
          </p>
        </div>

        <div>
          <p class="text-muted text-sm">
            Status
          </p>

          <StatusBadge :status="tournament?.displayStatus" />
        </div>

        <div>
          <p class="text-muted text-sm">
            Venue
          </p>

          <p class="font-semibold mt-1">
            {{ tournament?.location }}
          </p>
        </div>

        <div>
          <p class="text-muted text-sm">
            Total Matches
          </p>

          <p class="font-semibold mt-1">
            {{ matches.length }}
          </p>
        </div>
      </div>
    </div>

    <!-- Recent Matches -->
    <div class="rounded-3xl border border-line bg-surface p-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold">
          Recent Matches
        </h2>
      </div>

      <div v-if="matches.length === 0" class="text-center py-16 text-muted">
        <AlertCircle class="mx-auto mb-3 w-10 h-10" />
        No matches available.
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="match in matches.slice(0, 10)"
          :key="match.id"
          class="rounded-2xl border border-line p-4 hover:border-blue-500 transition"
        >
          <div class="flex justify-between">
            <div>
            <div class="font-semibold">
              {{ athleteName(match.redAthlete) }}
              <span class="text-muted px-2">vs</span>
              {{ athleteName(match.blueAthlete) }}
            </div>
              <div class="text-sm text-muted mt-1">
                {{ match.category?.name }}
              </div>
              <div v-if="match.referee || match.scorekeeper" class="text-xs text-muted mt-1">
                <span v-if="match.referee">Referee: {{ match.referee.name }}</span>
                <span v-if="match.referee && match.scorekeeper" class="px-1">·</span>
                <span v-if="match.scorekeeper">Scorekeeper: {{ match.scorekeeper.name }}</span>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span :class="[...matchStatusMeta[match.status].class]">
                {{ matchStatusMeta[match.status].label }}
              </span>
              <button
                v-if="isAdmin"
                @click="$emit('assign-officials', match)"
                class="rounded-lg border border-line px-3 py-1.5 text-xs font-medium hover:bg-surface"
              >
                Assign officials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>