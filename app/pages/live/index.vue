<script setup lang="ts">
import { computed } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'public',
})

const { matches, pending, error } = useLiveMatches()

function getAthleteName(athlete?: {
  fullName?: string | null
  name?: string | null
  firstName?: string | null
  lastName?: string | null
} | null) {
  if (!athlete) return 'TBD'
  return (
    athlete.fullName ||
    athlete.name ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}

function formatRound(round?: string) {
  if (!round) return ''
  return round
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatTime(seconds?: number) {
  if (seconds == null || Number.isNaN(seconds)) return '—'
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

const tatamiGroups = computed(() => {
  const map = new Map<string, typeof matches.value>()

  for (const m of matches.value) {
    const key = m.tatami
      ? `Tatami ${m.tatami.number}`
      : 'Unassigned'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
    .map(([tatami, items]) => ({ tatami, items }))
})

const liveCount = computed(
  () => matches.value.filter((m) => m.status === 'IN_PROGRESS').length,
)
</script>

<template>
  <div class="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-6xl space-y-8">
      <!-- Header -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <p class="text-sm font-semibold uppercase tracking-wide text-green-400">
              Live board
            </p>
          </div>
          <h1 class="mt-1 text-3xl font-bold text-foreground">
            Live Matches
          </h1>
          <p class="mt-1 text-sm text-muted">
            Updates every few seconds · No login required
          </p>
        </div>

        <div
          v-if="!pending && matches.length"
          class="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-muted"
        >
          <span class="font-semibold text-green-400">{{ liveCount }}</span>
          live
          ·
          <span class="font-semibold text-foreground">{{ matches.length }}</span>
          on board
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="pending && !matches.length"
        class="flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface py-20 text-sm text-muted"
      >
        <Loader2 class="h-5 w-5 animate-spin text-blue-400" />
        Loading live matches...
      </div>

      <div
        v-else-if="error"
        class="rounded-2xl border border-red-500/40 bg-red-500/10 py-12 text-center text-red-300"
      >
        {{ error }}
      </div>

      <div
        v-else-if="matches.length === 0"
        class="rounded-2xl border border-dashed border-line bg-surface py-20 text-center"
      >
        <p class="text-lg font-medium text-foreground">
          No matches are live right now
        </p>
        <p class="mt-2 text-sm text-muted">
          This board refreshes automatically when a bout starts.
        </p>
      </div>

      <!-- By tatami -->
      <div v-else class="space-y-8">
        <section
          v-for="group in tatamiGroups"
          :key="group.tatami"
          class="space-y-4"
        >
          <div class="flex items-center justify-between border-b border-line pb-2">
            <h2 class="text-lg font-semibold text-foreground">
              {{ group.tatami }}
            </h2>
            <span class="text-xs text-muted">
              {{ group.items.length }} active
            </span>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <NuxtLink
              v-for="m in group.items"
              :key="m.id"
              :to="`/live-scoring/${m.id}`"
              class="block rounded-2xl border border-line bg-panel p-5 transition hover:border-blue-500/40 hover:bg-surface-hover"
            >
              <div class="mb-3 flex items-center justify-between gap-2">
                <span
                  class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"
                  :class="m.status === 'IN_PROGRESS' ? 'text-green-400' : 'text-yellow-400'"
                >
                  <span
                    class="h-2 w-2 rounded-full"
                    :class="m.status === 'IN_PROGRESS'
                      ? 'bg-green-500 animate-pulse'
                      : 'bg-yellow-500'"
                  />
                  {{ m.status === 'IN_PROGRESS' ? 'Live' : 'Paused' }}
                </span>

                <span class="font-mono text-sm tabular-nums text-muted">
                  {{ formatTime(m.timeRemaining) }}
                </span>
              </div>

              <p class="mb-4 text-sm text-muted">
                {{ m.category?.name || 'Category' }}
                <span v-if="m.round"> · {{ formatRound(m.round) }}</span>
              </p>

              <div class="flex items-center justify-between gap-3">
                <div class="min-w-0 flex-1">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-red-400">
                    Aka
                  </p>
                  <p class="truncate font-semibold text-foreground">
                    {{ getAthleteName(m.redAthlete) }}
                  </p>
                </div>

                <div class="shrink-0 rounded-xl bg-canvas px-3 py-2 text-center">
                  <p class="font-mono text-xl font-bold tabular-nums text-foreground">
                    {{ m.redScore }}–{{ m.blueScore }}
                  </p>
                </div>

                <div class="min-w-0 flex-1 text-right">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    Ao
                  </p>
                  <p class="truncate font-semibold text-foreground">
                    {{ getAthleteName(m.blueAthlete) }}
                  </p>
                </div>
              </div>
            </NuxtLink>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>