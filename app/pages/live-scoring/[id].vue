<script setup lang="ts">
definePageMeta({
  layout: 'public',
})
const route = useRoute()
const matchId = route.params.id as string

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
      }, 8000)
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
  <div class="min-h-screen bg-canvas">

    <div
      v-if="pending"
      class="flex min-h-screen items-center justify-center text-foreground/60"
    >
      Loading match...
    </div>

    <div
      v-else-if="error"
      class="flex min-h-screen items-center justify-center text-red-400"
    >
      {{ error }}
    </div>

    <template v-else-if="match">
      <MatchesScoreboard :match="match" />
      <ScoringScoreAnimation :flash="lastScoreFlash" />
      <ScoringWinnerAnimation
        :winner="showWinnerAnimation ? winnerData : null"
        @dismiss="dismissWinnerAnimation"
      />
    </template>
  </div>
</template>