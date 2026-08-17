<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useScorekeeperMatches } from '~/composables/useScorekeeperMatches'
import { athleteDisplayName } from '~/composables/useMatches'

definePageMeta({
  layout: 'scorekeeper',
  middleware: 'scorekeeper',
})

const { matches, pending, error, fetchAssignedToScorekeeper } =
  useScorekeeperMatches()

onMounted(() => fetchAssignedToScorekeeper())

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
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6 p-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Results</h1>
      <p class="mt-1 text-sm text-muted">
        Completed matches you scored
      </p>
    </div>

    <div
      v-if="pending && !matches.length"
      class="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-12 text-sm text-muted"
    >
      <Loader2 class="h-5 w-5 animate-spin text-blue-400" />
      Loading results...
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
      <p class="text-sm font-medium text-foreground">No completed matches yet</p>
      <p class="mt-1 text-sm text-muted">
        Finished bouts will show here.
      </p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="m in completedMatches"
        :key="m.id"
        class="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
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
          <p class="mt-1 text-sm font-semibold tabular-nums">
            {{ m.redScore ?? 0 }} – {{ m.blueScore ?? 0 }}
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