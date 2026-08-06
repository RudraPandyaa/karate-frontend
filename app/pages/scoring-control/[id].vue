<script setup lang="ts">
definePageMeta({
  middleware: 'scorekeeper',
})

const route = useRoute()
const matchId = route.params.id as string

const {
  match,
  pending,
  submitting,
  submitError,
  recordScore,
  undoScore,
  startTimer,
  pauseTimer,
  adjustTime,
  notification,
  notificationType,
  lastScoreEventId,
  recordPenalty,
  lastScoreFlash,
  restartMatch,
} = useScoringAdmin(matchId)

function handleScore(corner: 'RED' | 'BLUE', type: 'YUKO' | 'WAZA_ARI' | 'IPPON') {
  recordScore(corner, type)
}

function handlePenalty(
  corner: 'RED' | 'BLUE',
  type: 'CHUI' | 'HANSOKU_CHUI' | 'HANSOKU',
) {
  recordPenalty(corner, type)
}

async function handleUndoLast() {
  if (!lastScoreEventId.value) {
    alert('No score to undo')
    return
  }
  await undoScore(lastScoreEventId.value)
}

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
  <div class="min-h-screen bg-canvas px-6 py-10">

    <div
      v-if="pending"
      class="text-center text-foreground/60"
    >
      Loading match...
    </div>

    <div
      v-else-if="!match"
      class="text-center text-red-400"
    >
      Match not found
    </div>

    <MatchesScoringControls
      v-else
      :match="match"
      :timer="match.timeRemaining"
      :notification="notification"
      :match-status="match.status"
      :submitting="submitting"
      :submit-error="submitError"
      :can-undo="!!lastScoreEventId"
      @penalty="handlePenalty"
      :notification-type="notificationType"
      @score="handleScore"
      @undo-last="handleUndoLast"
      @start="startTimer"
      @pause="pauseTimer"
      @adjust-time="adjustTime"
      @restart="restartMatch"
    />
    <ScoringScoreAnimation
      v-if="match"
      :flash="lastScoreFlash"
    />
    <ScoringWinnerAnimation
      :winner="showWinnerAnimation ? winnerData : null"
      @dismiss="dismissWinnerAnimation"
    />

  </div>
</template>