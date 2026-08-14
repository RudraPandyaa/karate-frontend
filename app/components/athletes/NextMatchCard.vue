<script setup lang="ts">
import type { AthleteDashboardMatch } from '~/composables/useAthleteDashboard'

const props = defineProps<{
  match: AthleteDashboardMatch | null
  athleteId?: string | null
}>()

function athleteName(athlete?: any) {
  if (!athlete) return 'TBD'
  return (
    athlete.fullName ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}

function athleteInitials(athlete?: any) {
  const name = athleteName(athlete)
  if (name === 'TBD') return '?'
  const parts = name.split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

function formatRound(round?: string) {
  if (!round) return 'Match'
  return round
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const isYouRed = computed(() => {
  if (!props.athleteId || !props.match?.redAthlete) return false
  return props.match.redAthlete.id === props.athleteId
})

const isYouBlue = computed(() => {
  if (!props.athleteId || !props.match?.blueAthlete) return false
  return props.match.blueAthlete.id === props.athleteId
})

const statusLabel = computed(() => {
  const status = props.match?.status
  if (status === 'IN_PROGRESS') return 'LIVE'
  if (status === 'PAUSED') return 'PAUSED'
  if (status === 'SCHEDULED') return 'UPCOMING'
  if (status === 'COMPLETED') return 'FINISHED'
  return status || 'UPCOMING'
})

const statusClass = computed(() => {
  const status = props.match?.status
  if (status === 'IN_PROGRESS') return 'bg-green-500/15 text-green-400'
  if (status === 'PAUSED') return 'bg-yellow-500/15 text-yellow-400'
  if (status === 'COMPLETED') return 'bg-zinc-500/15 text-zinc-300'
  return 'bg-blue-500/15 text-blue-400'
})
</script>

<template>
  <div
    v-if="!match"
    class="rounded-3xl border border-line bg-surface p-8 text-center"
  >
    <p class="text-sm text-muted">No upcoming match scheduled</p>
  </div>

  <div
    v-else
    class="overflow-hidden rounded-3xl border border-line bg-surface"
  >
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
      <div class="flex flex-wrap items-center gap-2">
        <span
          class="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
          :class="statusClass"
        >
          {{ statusLabel }}
        </span>

        <span class="text-sm font-medium text-foreground">
          {{ match.category?.name || 'Category' }}
        </span>

        <span class="text-sm text-muted">
          · {{ formatRound(match.round) }}
        </span>
      </div>

      <div class="flex items-center gap-3">
        <span v-if="match.tatami" class="text-sm text-muted">
          Tatami {{ match.tatami.number }}
        </span>

        <NuxtLink
          v-if="match.status === 'IN_PROGRESS' || match.status === 'PAUSED'"
          :to="`/live-scoring/${match.id}`"
          class="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-500"
        >
          Watch Live
        </NuxtLink>
      </div>
    </div>

    <!-- Athletes -->
    <div class="grid gap-4 p-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
      <!-- RED / AKA -->
      <div
        class="rounded-2xl border p-4"
        :class="isYouRed
          ? 'border-red-500/50 bg-red-500/10'
          : 'border-red-500/20 bg-red-950/20'"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-widest text-red-400">
            AKA / RED
          </span>
          <span
            v-if="isYouRed"
            class="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white"
          >
            YOU
          </span>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-red-500/40 bg-red-900/40">
            <img
              v-if="match.redAthlete?.photoUrl"
              :src="match.redAthlete.photoUrl"
              class="h-full w-full object-cover"
            />
            <span v-else class="text-sm font-bold text-red-200">
              {{ athleteInitials(match.redAthlete) }}
            </span>
          </div>

          <div class="min-w-0">
            <p class="truncate font-semibold text-foreground">
              {{ athleteName(match.redAthlete) }}
            </p>
            <p class="text-xs text-muted">
              {{ match.redAthlete?.country || '—' }}
            </p>
          </div>
        </div>
      </div>

      <!-- VS -->
      <div class="text-center text-sm font-bold text-muted">
        VS
      </div>

      <!-- BLUE / AO -->
      <div
        class="rounded-2xl border p-4"
        :class="isYouBlue
          ? 'border-blue-500/50 bg-blue-500/10'
          : 'border-blue-500/20 bg-blue-950/20'"
      >
        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs font-bold uppercase tracking-widest text-blue-400">
            AO / BLUE
          </span>
          <span
            v-if="isYouBlue"
            class="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white"
          >
            YOU
          </span>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-blue-500/40 bg-blue-900/40">
            <img
              v-if="match.blueAthlete?.photoUrl"
              :src="match.blueAthlete.photoUrl"
              class="h-full w-full object-cover"
            />
            <span v-else class="text-sm font-bold text-blue-200">
              {{ athleteInitials(match.blueAthlete) }}
            </span>
          </div>

          <div class="min-w-0">
            <p class="truncate font-semibold text-foreground">
              {{ athleteName(match.blueAthlete) }}
            </p>
            <p class="text-xs text-muted">
              {{ match.blueAthlete?.country || '—' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>