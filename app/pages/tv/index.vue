<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
definePageMeta({
  layout: false,
})

const { matches, pending, error } = useLiveMatches()

function athleteName(a?: any) {
  if (!a) return 'TBD'
  return (
    a.fullName ||
    a.name ||
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}

function formatTime(seconds?: number) {
  if (seconds == null || Number.isNaN(seconds)) return '—'
  const s = Math.max(0, Math.floor(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

function formatRound(round?: string) {
  if (!round) return ''
  return round
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const sorted = computed(() =>
  [...matches.value].sort((a, b) => {
    const ta = a.tatami?.number ?? 999
    const tb = b.tatami?.number ?? 999
    return ta - tb
  }),
)
</script>

<template>
  <div class="min-h-screen bg-[#050914] text-white">
    <div class="mx-auto max-w-[1600px] px-6 py-6 lg:px-10">
      <!-- Header -->
      <div class="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
            <p class="text-xs font-bold uppercase tracking-[0.25em] text-green-400">
              Arena TV
            </p>
          </div>
          <h1 class="mt-1 text-3xl font-black tracking-tight">
            Live Tatamis
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <span class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">
            <span class="font-bold text-green-400">{{ matches.length }}</span>
            on board
          </span>
          <NuxtLink
            to="/live"
            class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white"
          >
            Exit TV
          </NuxtLink>
        </div>
      </div>

      <!-- Loading -->
        <div
            v-if="pending && !matches.length"
            class="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-white/60"
            >
            <Loader2 class="h-8 w-8 animate-spin text-blue-500" />
            <p class="text-sm">Loading live board...</p>
        </div>

      <div
        v-else-if="error"
        class="flex min-h-[40vh] items-center justify-center text-red-400"
      >
        {{ error }}
      </div>

      <div
        v-else-if="matches.length === 0"
        class="flex min-h-[50vh] flex-col items-center justify-center text-center"
      >
        <p class="text-2xl font-bold text-white/80">No live matches</p>
        <p class="mt-2 text-white/40">Board updates automatically</p>
      </div>

      <!-- Grid -->
      <div
        v-else
        class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
        <NuxtLink
          v-for="m in sorted"
          :key="m.id"
          :to="m.tatami?.number
            ? `/tv/${m.tatami.number}`
            : `/live-scoring/${m.id}`"
          class="block rounded-3xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-blue-500/40 hover:bg-white/[0.07]"
        >
          <div class="mb-4 flex items-center justify-between gap-2">
            <span class="text-sm font-bold uppercase tracking-wide text-white/50">
              {{ m.tatami ? `Tatami ${m.tatami.number}` : 'Unassigned' }}
            </span>
            <span
              class="rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide"
              :class="m.status === 'IN_PROGRESS'
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-300'"
            >
              {{ m.status === 'IN_PROGRESS' ? 'LIVE' : 'PAUSED' }}
            </span>
          </div>

          <p class="mb-4 text-xs text-white/40">
            {{ m.category?.name || 'Category' }}
            <span v-if="m.round"> · {{ formatRound(m.round) }}</span>
          </p>

          <div class="flex items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="text-[10px] font-bold uppercase tracking-wider text-red-400">
                Aka
              </p>
              <p class="truncate text-lg font-bold">
                {{ athleteName(m.redAthlete) }}
              </p>
            </div>

            <div class="shrink-0 rounded-2xl bg-black/40 px-4 py-3 text-center">
              <p class="font-mono text-3xl font-black tabular-nums">
                {{ m.redScore }}–{{ m.blueScore }}
              </p>
              <p class="mt-1 font-mono text-sm text-white/50">
                {{ formatTime(m.timeRemaining) }}
              </p>
            </div>

            <div class="min-w-0 flex-1 text-right">
              <p class="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                Ao
              </p>
              <p class="truncate text-lg font-bold">
                {{ athleteName(m.blueAthlete) }}
              </p>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>