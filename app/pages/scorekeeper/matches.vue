<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useScorekeeperMatches } from '~/composables/useScorekeeperMatches'
import { athleteDisplayName } from '~/composables/useMatches'

definePageMeta({
  layout: 'scorekeeper',
  middleware: 'scorekeeper',
})

const {
  matches,
  pending,
  error,
  fetchAssignedToScorekeeper,
} = useScorekeeperMatches()

const filter = ref<'all' | 'live' | 'upcoming' | 'completed'>('all')

onMounted(() => {
  fetchAssignedToScorekeeper()
  const timer = setInterval(() => fetchAssignedToScorekeeper(), 20000)
  onUnmounted(() => clearInterval(timer))
})

const filtered = computed(() => {
  const list = matches.value
  if (filter.value === 'live') {
    return list.filter((m) =>
      ['IN_PROGRESS', 'PAUSED'].includes(m.status),
    )
  }
  if (filter.value === 'upcoming') {
    return list.filter((m) => m.status === 'SCHEDULED')
  }
  if (filter.value === 'completed') {
    return list.filter((m) => m.status === 'COMPLETED')
  }
  return list
})

function statusLabel(status: string) {
  if (status === 'IN_PROGRESS') return 'LIVE'
  if (status === 'PAUSED') return 'PAUSED'
  if (status === 'SCHEDULED') return 'UPCOMING'
  if (status === 'COMPLETED') return 'FINISHED'
  return status
}

function statusClass(status: string) {
  if (status === 'IN_PROGRESS') return 'bg-green-500/15 text-green-400'
  if (status === 'PAUSED') return 'bg-yellow-500/15 text-yellow-400'
  if (status === 'COMPLETED') return 'bg-zinc-500/15 text-zinc-300'
  return 'bg-blue-500/15 text-blue-400'
}

function formatRound(round?: string) {
  if (!round) return 'Match'
  return round
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function showScore(status: string) {
  return ['IN_PROGRESS', 'PAUSED', 'COMPLETED'].includes(status)
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">My Matches</h1>
      <p class="mt-1 text-sm text-muted">
        Matches assigned to you as scorekeeper
      </p>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="item in [
          { key: 'all', label: 'All' },
          { key: 'live', label: 'Live' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'completed', label: 'Completed' },
        ]"
        :key="item.key"
        class="rounded-xl border px-4 py-2 text-sm font-medium transition"
        :class="filter === item.key
          ? 'border-blue-500 bg-blue-600/15 text-blue-400'
          : 'border-line bg-surface text-muted hover:bg-surface-hover hover:text-foreground'"
        @click="filter = item.key as any"
      >
        {{ item.label }}
      </button>
    </div>

    <div
      v-if="pending && !matches.length"
      class="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-12 text-sm text-muted"
    >
      <Loader2 class="h-5 w-5 animate-spin text-blue-400" />
      Loading matches...
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300"
    >
      {{ error }}
    </div>

    <div
      v-else-if="filtered.length === 0"
      class="rounded-xl border border-line bg-surface p-8 text-center"
    >
      <p class="text-sm text-muted">No matches in this filter.</p>
      <p class="mt-2 text-xs text-muted">
        Organizer must assign you as scorekeeper on a match.
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="m in filtered"
        :key="m.id"
        class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2.5 py-1 text-xs font-bold"
              :class="statusClass(m.status)"
            >
              {{ statusLabel(m.status) }}
            </span>
            <span class="text-xs text-muted">{{ formatRound(m.round) }}</span>
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

          <p
            v-if="showScore(m.status)"
            class="mt-1 text-sm font-semibold tabular-nums text-foreground"
          >
            {{ m.redScore ?? 0 }} – {{ m.blueScore ?? 0 }}
          </p>
        </div>

        <NuxtLink
          v-if="m.status !== 'COMPLETED'"
          :to="`/scoring-control/${m.id}`"
          class="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-500"
        >
          Open Scoring
        </NuxtLink>
        <NuxtLink
          v-else
          :to="`/scoring-control/${m.id}`"
          class="shrink-0 rounded-lg border border-line px-4 py-2 text-center text-sm font-medium text-muted hover:bg-surface-hover"
        >
          View
        </NuxtLink>
      </div>
    </div>
  </div>
</template>