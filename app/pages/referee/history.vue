<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useRefereeMatches } from '~/composables/useRefereeMatches'
import { athleteDisplayName } from '~/composables/useMatches'

definePageMeta({
  layout: 'default',
  middleware: 'referee',
})

const { matches, pending, error, fetchAssignedToReferee } = useRefereeMatches()

onMounted(() => {
  fetchAssignedToReferee()
})

const completedMatches = computed(() =>
  matches.value.filter((m) => m.status === 'COMPLETED'),
)

function formatRound(round?: string) {
  if (!round) return 'Match'
  return round
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function winnerLabel(m: any) {
  if (!m.winnerId) return null
  if (m.redAthlete?.id === m.winnerId) {
    return athleteDisplayName(m.redAthlete)
  }
  if (m.blueAthlete?.id === m.winnerId) {
    return athleteDisplayName(m.blueAthlete)
  }
  return null
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Match History</h1>
      <p class="mt-1 text-sm text-muted">
        Past matches you have officiated
      </p>
    </div>

    <div
      v-if="pending && !matches.length"
      class="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-12 text-sm text-muted"
    >
      <Loader2 class="h-5 w-5 animate-spin text-amber-400" />
      Loading history...
    </div>

    <div
      v-else-if="error"
      class="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-red-300"
    >
      {{ error }}
    </div>

    <div
      v-else-if="completedMatches.length === 0"
      class="rounded-xl border border-line bg-surface p-8 text-center"
    >
      <p class="text-sm font-medium text-foreground">No match history yet</p>
      <p class="mt-1 text-sm text-muted">
        Completed bouts you referee will appear here.
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="m in completedMatches"
        :key="m.id"
        class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full bg-zinc-500/15 px-2.5 py-1 text-xs font-bold text-zinc-300">
              FINISHED
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

          <p class="mt-1 text-sm font-semibold tabular-nums text-foreground">
            {{ m.redScore ?? 0 }} – {{ m.blueScore ?? 0 }}
            <span
              v-if="winnerLabel(m)"
              class="ml-2 text-xs font-medium text-green-400"
            >
              Winner: {{ winnerLabel(m) }}
            </span>
          </p>
        </div>

        <NuxtLink
          :to="`/scoring-control/${m.id}`"
          class="shrink-0 rounded-lg border border-line px-4 py-2 text-center text-sm font-medium text-muted hover:bg-surface-hover"
        >
          View
        </NuxtLink>
      </div>
    </div>
  </div>
</template>