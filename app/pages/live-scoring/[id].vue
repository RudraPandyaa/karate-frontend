<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'

definePageMeta({
  layout: false,
})

const route = useRoute()
const matchId = route.params.id as string
const isTv = computed(() => String(route.query.tv || '') === '1')

const { match, pending, error, lastScoreFlash } = useLiveMatch(matchId)

function getAthleteName(athlete?: any) {
  if (!athlete) return 'TBD'
  return (
    athlete.fullName ||
    athlete.name ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}

const showWinnerAnimation = ref(false)
let winnerTimeout: ReturnType<typeof setTimeout> | null = null

const winnerData = computed(() => {
  if (!match.value || match.value.status !== 'COMPLETED' || !match.value.winnerId) {
    return null
  }
  if (match.value.winnerId === match.value.redAthlete?.id) {
    return { corner: 'RED' as const, athleteName: getAthleteName(match.value.redAthlete) }
  }
  if (match.value.winnerId === match.value.blueAthlete?.id) {
    return { corner: 'BLUE' as const, athleteName: getAthleteName(match.value.blueAthlete) }
  }
  return null
})

watch(
  () => match.value?.status,
  (status) => {
    if (status === 'COMPLETED' && winnerData.value) {
      showWinnerAnimation.value = true
      if (winnerTimeout) clearTimeout(winnerTimeout)
      winnerTimeout = setTimeout(() => {
        showWinnerAnimation.value = false
      }, 5000)
    }
  },
  { immediate: true },
)

function dismissWinnerAnimation() {
  showWinnerAnimation.value = false
  if (winnerTimeout) clearTimeout(winnerTimeout)
}

onUnmounted(() => {
  if (winnerTimeout) clearTimeout(winnerTimeout)
})
</script>

<template>
  <div
    class="min-h-screen"
    :class="isTv ? 'bg-[#050914] text-white' : 'bg-canvas'"
  >
    <!-- Non-TV top bar -->
    <div
      v-if="!isTv"
      class="flex items-center justify-between border-b border-line bg-panel px-4 py-3"
    >
      <NuxtLink
        to="/live"
        class="text-sm text-muted hover:text-foreground"
      >
        ← Live board
      </NuxtLink>
      <NuxtLink
        :to="`/live-scoring/${matchId}?tv=1`"
        class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
      >
        TV mode
      </NuxtLink>
    </div>

    <!-- TV exit -->
    <div
      v-else
      class="absolute right-4 top-4 z-20"
    >
      <NuxtLink
        :to="`/live-scoring/${matchId}`"
        class="rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs text-white/60 hover:text-white"
      >
        Exit TV
      </NuxtLink>
    </div>

    <!-- Loading -->
    <div
      v-if="pending"
      class="flex min-h-screen flex-col items-center justify-center gap-3"
      :class="isTv ? 'text-white/60' : 'text-muted'"
    >
      <Loader2 class="h-8 w-8 animate-spin text-blue-500" />
      <p class="text-sm">Loading match...</p>
    </div>

    <div
      v-else-if="error"
      class="flex min-h-screen items-center justify-center text-red-400"
    >
      {{ error }}
    </div>

    <template v-else-if="match">
      <div :class="isTv ? 'scale-100 p-4 lg:p-8' : ''">
        <MatchesScoreboard
          :match="match"
          :tv="isTv"
        />
      </div>

      <ScoringScoreAnimation :flash="lastScoreFlash" />
      <ScoringWinnerAnimation
        :winner="showWinnerAnimation ? winnerData : null"
        @dismiss="dismissWinnerAnimation"
      />
    </template>
  </div>
</template>