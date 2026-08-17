<script setup lang="ts">
import { Tv } from 'lucide-vue-next'
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'default',
  middleware: 'staff',
})

const { api } = useApi()
const { user } = useAuth()

const matches = ref<any[]>([])
const myAssignedIds = ref<Set<string>>(new Set())
const pending = ref(true)
const error = ref<string | null>(null)

const statusFilter = ref<'ACTIVE' | 'SCHEDULED' | 'ALL'>('ALL')

const isFullAccess = computed(() => {
  const r = user.value?.role
  return r === 'SUPER_ADMIN' || r === 'ADMIN' || r === 'ORGANIZER'
})

async function loadMatches() {
  pending.value = true
  error.value = null
  try {
    // All staff see the full board
    matches.value = await api('/matches')

    const role = user.value?.role
    if (role === 'REFEREE') {
      const assigned = await api<any[]>('/matches/assigned/referee')
      myAssignedIds.value = new Set(assigned.map((m) => m.id))
    } else if (role === 'SCOREKEEPER') {
      const assigned = await api<any[]>('/matches/assigned/scorekeeper')
      myAssignedIds.value = new Set(assigned.map((m) => m.id))
    } else {
      myAssignedIds.value = new Set()
    }
  } catch (err: any) {
    error.value =
      err?.data?.message || err?.message || 'Unable to load matches'
    matches.value = []
    myAssignedIds.value = new Set()
  } finally {
    pending.value = false
  }
}

function canOpenScoring(match: any) {
  if (isFullAccess.value) return true
  return myAssignedIds.value.has(match.id)
}

onMounted(loadMatches)

let poll: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  poll = setInterval(loadMatches, 10000)
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

const filtered = computed(() => {
  let list = matches.value.filter((m) => m.redAthlete && m.blueAthlete)

  if (statusFilter.value === 'ACTIVE') {
    list = list.filter((m) =>
      ['IN_PROGRESS', 'PAUSED'].includes(m.status),
    )
  } else if (statusFilter.value === 'SCHEDULED') {
    list = list.filter((m) => m.status === 'SCHEDULED')
  }

  return list
})

function statusClass(s: string) {
  if (s === 'IN_PROGRESS') return 'bg-green-500/15 text-green-400'
  if (s === 'PAUSED') return 'bg-yellow-500/15 text-yellow-400'
  if (s === 'COMPLETED') return 'bg-zinc-500/15 text-zinc-300'
  return 'bg-blue-500/15 text-blue-400'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-foreground">
          Live Scoring
        </h1>
        <p class="mt-1 text-sm text-muted">
          You can view every bout. Scoring controls only open on matches assigned to you.
        </p>
      </div>

      <NuxtLink
        to="/live"
        class="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm text-muted hover:bg-surface hover:text-foreground"
      >
        <Tv class="h-4 w-4" />
        Public live board
      </NuxtLink>
    </div>

    <div class="flex flex-wrap gap-2">
      <button
        v-for="item in [
          { key: 'ACTIVE', label: 'Live / Paused' },
          { key: 'SCHEDULED', label: 'Scheduled' },
          { key: 'ALL', label: 'All with athletes' },
        ]"
        :key="item.key"
        type="button"
        class="rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition"
        :class="
          statusFilter === item.key
            ? 'border-blue-500 bg-blue-600/15 text-blue-400'
            : 'border-line text-muted hover:bg-surface'
        "
        @click="statusFilter = item.key as any"
      >
        {{ item.label }}
      </button>
    </div>

    <PageLoader
      v-if="pending && !matches.length"
      text="Loading matches..."
    />

    <div
      v-else-if="error"
      class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </div>

    <div
      v-else-if="filtered.length === 0"
      class="rounded-2xl border border-dashed border-line bg-surface py-16 text-center"
    >
      <p class="text-lg font-medium text-foreground">
        No matches in this filter
      </p>
      <p class="mt-2 text-sm text-muted">
        Try another filter or wait for matches to be scheduled.
      </p>
      <NuxtLink
        v-if="isFullAccess"
        to="/admin/matches"
        class="mt-6 inline-block rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700"
      >
        Go to Matches
      </NuxtLink>
    </div>

    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="m in filtered"
        :key="m.id"
        class="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-bold"
              :class="statusClass(m.status)"
            >
              {{ m.status }}
            </span>
            <span class="text-xs text-muted">
              {{ m.tatami ? `Tatami ${m.tatami.number}` : 'No tatami' }}
            </span>
            <span
              v-if="canOpenScoring(m) && !isFullAccess"
              class="rounded-full bg-blue-600/15 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-400"
            >
              Assigned to you
            </span>
          </div>

          <p class="mt-1 font-medium text-foreground">
            <span class="text-red-400">{{ athleteName(m.redAthlete) }}</span>
            <span class="mx-1 text-muted">vs</span>
            <span class="text-blue-400">{{ athleteName(m.blueAthlete) }}</span>
          </p>

          <p class="mt-1 text-xs text-muted">
            {{ m.category?.name || 'Category' }}
            · {{ m.round }}
            · {{ m.redScore }}–{{ m.blueScore }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <NuxtLink
            v-if="canOpenScoring(m)"
            :to="`/scoring-control/${m.id}`"
            class="rounded-xl bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-500"
          >
            Open scoring
          </NuxtLink>

          <NuxtLink
            v-else
            :to="`/live-scoring/${m.id}`"
            class="rounded-xl border border-line px-4 py-2 text-center text-sm font-medium text-muted hover:bg-surface hover:text-foreground"
          >
            View only
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>