<script setup lang="ts">
import type { Tatami } from '~/composables/useTatami'
import { computeTatamiSchedule, type ScheduledMatch } from '~/composables/useTatamiSchedule'
import CurrentMatch from '~/components/tatami/CurrentMatch.vue'
import MatchTimeBadge from '~/components/tatami/MatchTimeBadge.vue'

const props = defineProps<{
  tatami: Tatami
}>()

const emit = defineEmits<{
  edit: [tatami: Tatami]
  delete: [id: string]
}>()

const { getQueue } = useTatami()
const { isAdmin, user } = useAuth()

const queue = ref<{
  current: any | null
  next: any[]
}>({
  current: null,
  next: [],
})

const loading = ref(true)

const SCORING_ROLES = ['ADMIN', 'SUPER_ADMIN', 'REFEREE', 'SCOREKEEPER', 'OPERATOR'] as const

const canScore = computed(() => {
  const role = user.value?.role
  return !!role && SCORING_ROLES.includes(role as any)
})

/** Path for the live/current match based on role */
const liveMatchPath = computed(() => {
  const matchId = queue.value.current?.id
  if (!matchId) return null

  if (canScore.value) {
    return `/scoring-control/${matchId}`
  }
  return `/live-scoring/${matchId}`
})

const isLive = computed(() => {
  const m = queue.value.current
  if (!m) return false
  return m.status === 'IN_PROGRESS' || m.status === 'PAUSED' || !!m.id
})

// Current match + upcoming queue, run through the tatami scheduler together
// so "next" matches cascade off whenever the current match is expected to
// end (or off their own explicit scheduledTime, if one was set when the
// match was created).
const scheduledQueue = computed(() => {
  const all = [queue.value.current, ...queue.value.next].filter(Boolean) as any[]
  const scheduled = computeTatamiSchedule(all)
  const byId = new Map(scheduled.map((s) => [s.match.id, s]))

  return {
    current: queue.value.current
      ? byId.get(queue.value.current.id) ?? null
      : null,
    next: queue.value.next
      .map((m) => byId.get(m.id))
      .filter(Boolean) as ScheduledMatch[],
  }
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

function athleteLine(a?: any) {
  if (!a) return 'TBD'
  const flag = a.country ? getFlagEmoji(a.country) + ' ' : ''
  return flag + athleteName(a)
}

async function loadQueue() {
  loading.value = true
  try {
    queue.value = await getQueue(props.tatami.id)
  } catch (err) {
    console.error('Failed to load queue:', err)
    queue.value = { current: null, next: [] }
  } finally {
    loading.value = false
  }
}

function openLiveMatch() {
  if (!liveMatchPath.value) return
  navigateTo(liveMatchPath.value)
}

onMounted(loadQueue)

watch(
  () => props.tatami.id,
  () => {
    loadQueue()
  }
)
</script>

<template>
  <div
    class="rounded-2xl border border-line bg-panel p-6 shadow-lg transition"
    :class="isLive ? 'hover:border-blue-500' : 'hover:border-line'"
  >
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-foreground">
          Tatami {{ tatami.number }}
        </h2>
        <p class="text-sm text-muted">
          {{ tatami.name || 'No Name' }}
        </p>
      </div>

      <div
        class="h-4 w-4 rounded-full"
        :class="isLive ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'"
      />
    </div>

    <!-- Current Match -->
    <div class="mt-8">
      <h3 class="mb-3 text-xs uppercase tracking-widest text-muted">
        Current Match
      </h3>

      <div
        v-if="isLive && liveMatchPath"
        class="cursor-pointer"
        @click="openLiveMatch"
      >
        <CurrentMatch
          :match="queue.current"
          :loading="loading"
          :estimated-start="scheduledQueue.current?.estimatedStart"
          :is-fixed-time="scheduledQueue.current?.isFixedTime"
        />
      </div>

      <CurrentMatch
        v-else
        :match="queue.current"
        :loading="loading"
        :estimated-start="scheduledQueue.current?.estimatedStart"
        :is-fixed-time="scheduledQueue.current?.isFixedTime"
      />
    </div>

    <!-- Upcoming Matches -->
    <div class="mt-8">
      <h3 class="mb-3 text-xs uppercase tracking-widest text-muted">
        Upcoming Matches
      </h3>

      <div v-if="loading" class="text-sm text-muted">
        Loading...
      </div>

      <div v-else-if="scheduledQueue.next.length === 0" class="text-sm text-muted">
        No upcoming matches.
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="item in scheduledQueue.next"
          :key="item.match.id"
          class="rounded-lg border border-line bg-canvas p-3"
        >
          <div class="mb-2 flex items-center justify-between">
            <MatchTimeBadge
              :estimated-start="item.estimatedStart"
              :is-fixed-time="item.isFixedTime"
            />
          </div>
          <div class="font-medium text-foreground">
            {{ athleteLine(item.match.redAthlete) }}
          </div>
          <div class="my-1 text-center text-xs text-muted">VS</div>
          <div class="font-medium text-foreground">
            {{ athleteLine(item.match.blueAthlete) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer actions -->
    <div class="mt-8 flex flex-wrap gap-3">
      <!-- Live / Score button – role based -->
      <NuxtLink
        v-if="liveMatchPath"
        :to="liveMatchPath"
        class="flex-1 rounded-xl py-3 text-center font-medium text-white transition"
        :class="canScore
          ? 'bg-blue-600 hover:bg-blue-500'
          : 'bg-emerald-600 hover:bg-emerald-500'"
      >
        {{ canScore ? 'Score' : 'Watch Live' }}
      </NuxtLink>

      <button
        v-else
        disabled
        class="flex-1 cursor-not-allowed rounded-xl bg-surface py-3 text-foreground opacity-50"
      >
        No live match
      </button>

      <!-- Admin only -->
      <button
        v-if="isAdmin"
        class="rounded-xl bg-surface px-5 py-3 font-medium text-foreground hover:bg-surface-hover"
        @click="emit('edit', tatami)"
      >
        Edit
      </button>

      <button
        v-if="isAdmin"
        class="rounded-xl bg-red-700 px-5 py-3 font-medium text-white hover:bg-red-600"
        @click="emit('delete', tatami.id)"
      >
        Delete
      </button>
    </div>
  </div>
</template>