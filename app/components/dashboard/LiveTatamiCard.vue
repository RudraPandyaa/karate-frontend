<script setup lang="ts">
import type { LiveMatchSummary } from '~/types'

const props = defineProps<{ match: LiveMatchSummary }>()

const isKata = computed(() => props.match.discipline === 'KATA' || props.match.discipline === 'TEAM_KATA')

const timeLabel = computed(() => {
  const total = props.match.timeRemaining
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
})

// Highlight which corner is currently ahead — a quiet visual cue rather
// than a fixed color per card.
const leadingCorner = computed<'red' | 'blue' | null>(() => {
  if (isKata.value) {
    if (props.match.redKataScore == null || props.match.blueKataScore == null) return null
    if (props.match.redKataScore === props.match.blueKataScore) return null
    return props.match.redKataScore > props.match.blueKataScore ? 'red' : 'blue'
  }
  if (props.match.redScore === props.match.blueScore) return null
  return props.match.redScore > props.match.blueScore ? 'red' : 'blue'
})

const borderClass = computed(() => {
  if (leadingCorner.value === 'red') return 'border-l-4 border-l-aka'
  if (leadingCorner.value === 'blue') return 'border-l-4 border-l-ao'
  return ''
})
</script>

<template>
  <div class="flex flex-col rounded-2xl text-foreground border border-line bg-surface shadow-card overflow-hidden" :class="borderClass">
    <div class="flex items-center justify-between px-4 pt-4">
      <span class="text-xs font-bold tracking-wide text-foreground">TATAMI {{ match.tatami.number }}</span>
      <span class="text-xs text-muted truncate max-w-[55%] text-right">{{ match.category.name }}</span>
    </div>

    <div class="flex items-center justify-between px-4 pt-3">
      <div class="text-left">
        <p class="text-[11px] font-bold text-aka">AKA</p>
        <p class="text-sm font-semibold text-foreground truncate max-w-[110px]">{{ match.redAthlete?.name ?? 'TBD' }}</p>
      </div>
      <span class="text-xs font-semibold text-muted px-2">VS</span>
      <div class="text-right">
        <p class="text-[11px] font-bold text-ao">AO</p>
        <p class="text-sm font-semibold text-foreground truncate max-w-[110px]">{{ match.blueAthlete?.name ?? 'TBD' }}</p>
      </div>
    </div>

    <div class="flex items-center justify-between px-6 pt-2">
      <span class="text-3xl font-extrabold tabular text-foreground">
        {{ isKata ? match.redKataScore?.toFixed(1) ?? '-' : match.redScore }}
      </span>
      <span class="text-3xl font-extrabold tabular text-foreground">
        {{ isKata ? match.blueKataScore?.toFixed(1) ?? '-' : match.blueScore }}
      </span>
    </div>

    <div class="flex flex-col items-center py-3">
      <p class="text-2xl font-extrabold tabular text-muted">{{ timeLabel }}</p>
      <p class="text-[11px] font-semibold tracking-wide text-muted mt-0.5">{{ match.round }}</p>
    </div>

    <NuxtLink
      :to="`/live-scoring/${match.id}`"
      class="mt-auto block w-full bg-canvas border-t border-line py-3 text-center text-xs font-bold tracking-wide text-blue-400 hover:bg-surface-hover hover:text-blue-300 transition-colors"
    >
      OPEN LIVE SCORING
    </NuxtLink>
  </div>
</template>
