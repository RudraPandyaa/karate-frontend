<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
definePageMeta({
  layout: false,
})

const route = useRoute()
const tatamiNumber = computed(() => String(route.params.tatami || ''))

const { matches, pending, error, fetchAll } = useMatches()
const { matches: liveMatches, pending: livePending } = useLiveMatches()

onMounted(() => {
  fetchAll()
})

// Refresh all matches periodically for upcoming queue
let poll: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  poll = setInterval(() => {
    fetchAll()
  }, 15000)
})
onUnmounted(() => {
  if (poll) clearInterval(poll)
})

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

function formatScheduledTime(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

const onThisTatamiLive = computed(() =>
  (liveMatches.value || []).filter(
    (m) => String(m.tatami?.number) === tatamiNumber.value,
  ),
)

const current = computed(() => {
  const live = onThisTatamiLive.value.find((m) => m.status === 'IN_PROGRESS')
  if (live) return live
  return onThisTatamiLive.value.find((m) => m.status === 'PAUSED') || null
})

const upcoming = computed(() =>
  matches.value
    .filter(
      (m) =>
        m.status === 'SCHEDULED' &&
        String(m.tatami?.number) === tatamiNumber.value &&
        m.redAthlete &&
        m.blueAthlete,
    )
    .sort((a, b) => {
      const ta = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0
      const tb = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0
      return ta - tb
    })
    .slice(0, 4),
)
</script>

<template>
  <div class="min-h-screen bg-[#050914] text-white">
    <div class="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:px-10 lg:py-8">
      <!-- Top bar -->
      <div class="mb-6 flex items-center justify-between gap-4">
        <div>
          <p class="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
            TV Mode
          </p>
          <h1 class="text-3xl font-black tracking-tight lg:text-4xl">
            Tatami {{ tatamiNumber }}
          </h1>
        </div>

        <div class="flex items-center gap-3">
          <span
            v-if="current"
            class="rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide"
            :class="current.status === 'IN_PROGRESS'
              ? 'bg-green-500/20 text-green-400'
              : 'bg-yellow-500/20 text-yellow-300'"
          >
            {{ current.status === 'IN_PROGRESS' ? 'LIVE' : 'PAUSED' }}
          </span>
          <NuxtLink
            to="/live"
            class="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:text-white"
          >
            Exit TV
          </NuxtLink>
        </div>
      </div>

        <div
            v-if="(pending || livePending) && !current && !upcoming.length"
            class="flex flex-1 flex-col items-center justify-center gap-3 text-white/60"
            >
            <Loader2 class="h-8 w-8 animate-spin text-blue-500" />
            <p class="text-sm">Loading Tatami {{ tatamiNumber }}...</p>
        </div>

      <div
        v-else-if="error"
        class="flex flex-1 items-center justify-center text-red-400"
      >
        {{ error }}
      </div>

      <template v-else>
        <!-- Current match -->
        <div
          v-if="current"
          class="flex flex-1 flex-col justify-center"
        >
          <p class="mb-4 text-center text-sm text-white/50">
            {{ current.category?.name || 'Category' }}
            <span v-if="current.round"> · {{ formatRound(current.round) }}</span>
          </p>

          <div class="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
            <!-- RED -->
            <div class="rounded-3xl border border-red-500/30 bg-red-950/40 p-6 text-center lg:p-10">
              <p class="text-xs font-black uppercase tracking-[0.25em] text-red-400">
                Aka
              </p>
              <p class="mt-4 text-2xl font-black lg:text-4xl">
                {{ athleteName(current.redAthlete) }}
              </p>
              <p class="mt-6 font-mono text-6xl font-black tabular-nums text-red-400 lg:text-8xl">
                {{ current.redScore }}
              </p>
            </div>

            <!-- Center -->
            <div class="text-center">
              <p class="font-mono text-5xl font-black tabular-nums text-white lg:text-7xl">
                {{ formatTime(current.timeRemaining) }}
              </p>
              <p class="mt-3 text-sm font-bold uppercase tracking-widest text-white/40">
                vs
              </p>
              <NuxtLink
                :to="`/live-scoring/${current.id}?tv=1`"
                class="mt-4 inline-block text-xs text-blue-400 hover:underline"
              >
                Open scoreboard
              </NuxtLink>
            </div>

            <!-- BLUE -->
            <div class="rounded-3xl border border-blue-500/30 bg-blue-950/40 p-6 text-center lg:p-10">
              <p class="text-xs font-black uppercase tracking-[0.25em] text-blue-400">
                Ao
              </p>
              <p class="mt-4 text-2xl font-black lg:text-4xl">
                {{ athleteName(current.blueAthlete) }}
              </p>
              <p class="mt-6 font-mono text-6xl font-black tabular-nums text-blue-400 lg:text-8xl">
                {{ current.blueScore }}
              </p>
            </div>
          </div>
        </div>

        <!-- No current -->
        <div
          v-else
          class="flex flex-1 flex-col items-center justify-center text-center"
        >
          <p class="text-2xl font-bold text-white/80">
            No live match on Tatami {{ tatamiNumber }}
          </p>
          <p class="mt-2 text-white/40">
            Waiting for the next bout...
          </p>
        </div>

        <!-- Upcoming queue -->
        <div class="mt-8 border-t border-white/10 pt-6">
          <h2 class="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-white/40">
            Up next
          </h2>

          <div
            v-if="upcoming.length === 0"
            class="text-sm text-white/40"
          >
            No scheduled matches on this tatami.
          </div>

          <div
            v-else
            class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          >
            <div
              v-for="m in upcoming"
              :key="m.id"
              class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <p class="text-xs text-white/40">
                {{ formatRound(m.round) }}
                <span v-if="formatScheduledTime(m.scheduledTime)">
                  · {{ formatScheduledTime(m.scheduledTime) }}
                </span>
              </p>
              <p class="mt-1 truncate text-sm font-semibold">
                {{ athleteName(m.redAthlete) }}
                <span class="text-white/30"> vs </span>
                {{ athleteName(m.blueAthlete) }}
              </p>
              <p class="mt-1 truncate text-xs text-white/40">
                {{ m.category?.name }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>