<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useScorekeeperMatches } from '~/composables/useScorekeeperMatches'
import { useMatches, athleteDisplayName } from '~/composables/useMatches'

definePageMeta({
  layout: 'scorekeeper',
  middleware: 'scorekeeper',
})

const {
  matches: assignedMatches,
  pending: assignedPending,
  error: assignedError,
  fetchAssignedToScorekeeper,
} = useScorekeeperMatches()

const {
  matches: allMatches,
  pending: allPending,
  error: allError,
  fetchAll,
} = useMatches()

const scope = ref<'mine' | 'all'>('mine')

const filter = ref<'all' | 'live' | 'upcoming' | 'completed'>('all')

onMounted(() => {
  fetchAssignedToScorekeeper()
  fetchAll()

  const timer = setInterval(() => {
    fetchAssignedToScorekeeper()
    fetchAll()
  }, 20000)

  onUnmounted(() => clearInterval(timer))
})

const matches = computed(() => {
  return scope.value === 'mine'
    ? assignedMatches.value
    : allMatches.value
})

const pending = computed(() => {
  return scope.value === 'mine'
    ? assignedPending.value
    : allPending.value
})

const error = computed(() => {
  return scope.value === 'mine'
    ? assignedError.value
    : allError.value
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
  if (status === 'COMPLETED') return 'COMPLETED'

  return status
}

function statusClass(status: string) {
  if (status === 'IN_PROGRESS') {
    return 'bg-green-100 text-green-600'
  }

  if (status === 'PAUSED') {
    return 'bg-yellow-100 text-yellow-600'
  }

  if (status === 'COMPLETED') {
    return 'bg-gray-100 text-gray-500'
  }

  return 'bg-blue-100 text-blue-500'
}

function formatRound(round?: string) {
  if (!round) return 'Match'

  return round
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
</script>

<template>
  <div class="min-h-full bg-canvas">
    <div class="mx-auto max-w-6xl space-y-6 p-6 lg:p-8">

      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-foreground">
            Matches
          </h1>

          <p class="mt-1 text-sm text-muted">
            Your matches and full tournament schedule
          </p>
        </div>

        <!-- Scope -->
        <select
          v-model="scope"
          class="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-medium text-foreground outline-none transition focus:border-blue-500"
        >
          <option value="mine">
            My Matches
          </option>

          <option value="all">
            All Matches
          </option>
        </select>
      </div>

      <!-- Status filters -->
      <div class="flex flex-wrap gap-2">
        <button
          v-for="item in [
            { key: 'all', label: 'All' },
            { key: 'live', label: 'Live' },
            { key: 'upcoming', label: 'Upcoming' },
            { key: 'completed', label: 'Completed' },
          ]"
          :key="item.key"
          type="button"
          class="rounded-xl border px-4 py-2 text-sm font-medium transition"
          :class="
            filter === item.key
              ? 'border-blue-500 bg-blue-50 text-blue-500'
              : 'border-line bg-surface text-muted hover:bg-surface-hover hover:text-foreground'
          "
          @click="filter = item.key as typeof filter"
        >
          {{ item.label }}
        </button>
      </div>

      <!-- Loading -->
      <div
        v-if="pending && !matches.length"
        class="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-12 text-sm text-muted"
      >
        <Loader2 class="h-5 w-5 animate-spin text-blue-500" />
        Loading matches...
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400"
      >
        {{ error }}
      </div>

      <!-- Empty -->
      <div
        v-else-if="filtered.length === 0"
        class="rounded-2xl border border-line bg-surface p-12 text-center"
      >
        <p class="font-medium text-foreground">
          No matches found
        </p>

        <p class="mt-1 text-sm text-muted">
          {{
            scope === 'mine'
              ? 'No matches have been assigned to you yet.'
              : 'There are no matches in this filter.'
          }}
        </p>
      </div>

      <!-- Match list -->
      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="m in filtered"
          :key="m.id"
          class="flex items-center justify-between gap-6 rounded-2xl border border-line bg-surface px-5 py-5 transition hover:shadow-sm"
        >
          <div class="min-w-0">

            <div class="flex items-center gap-2">
              <span
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="statusClass(m.status)"
              >
                {{ statusLabel(m.status) }}
              </span>

              <span class="text-xs text-muted">
                {{ formatRound(m.round) }}
              </span>
            </div>

            <div class="mt-3">
              <p class="text-base font-semibold text-foreground">
                {{ athleteDisplayName(m.redAthlete) }}
              </p>

              <p class="text-base font-semibold text-foreground">
                vs<br>
                {{ athleteDisplayName(m.blueAthlete) }}
              </p>
            </div>

            <p class="mt-2 text-xs text-muted">
              {{ m.category?.name || 'Category' }}

              <span v-if="m.tatami">
                · Tatami {{ m.tatami.number }}
              </span>
            </p>
          </div>

          <div class="shrink-0 text-right">

            <p
              v-if="['IN_PROGRESS', 'PAUSED', 'COMPLETED'].includes(m.status)"
              class="mb-2 text-sm font-semibold tabular-nums text-foreground"
            >
              {{ m.redScore ?? 0 }}
              –
              {{ m.blueScore ?? 0 }}
            </p>

            <span
              class="inline-flex rounded-xl px-4 py-2 text-sm font-medium"
              :class="statusClass(m.status)"
            >
              {{ statusLabel(m.status) }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>