<script setup lang="ts">
import { getHomeRouteForRole } from '~/composables/useAuth'

definePageMeta({
  layout: 'default',
  middleware: 'staff',
})

const route = useRoute()
const matchId = route.params.id as string
const { user } = useAuth()
const { api } = useApi()

const accessPending = ref(true)
const accessError = ref<string | null>(null)
const canScore = ref(false)

async function checkAccess() {
  accessPending.value = true
  accessError.value = null
  canScore.value = false

  try {
    await api(`/matches/${matchId}/scoring-access`)
    canScore.value = true
  } catch (err: any) {
    accessError.value =
      err?.data?.message ||
      err?.message ||
      'You are not allowed to score this match'

    // optional auto-redirect after 2s
    setTimeout(() => {
      navigateTo(getHomeRouteForRole(user.value?.role))
    }, 2000)
  } finally {
    accessPending.value = false
  }
}

await checkAccess()

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

// only connect scoring after access is granted
watch(canScore, (ok) => {
  // useScoringAdmin currently auto-loads on mount.
  // If access failed, do not show controls.
})

function handleScore(corner: 'RED' | 'BLUE', type: 'YUKO' | 'WAZA_ARI' | 'IPPON') {
  if (!canScore.value) return
  recordScore(corner, type)
}

function handlePenalty(
  corner: 'RED' | 'BLUE',
  type: 'CHUI' | 'HANSOKU_CHUI' | 'HANSOKU',
) {
  if (!canScore.value) return
  recordPenalty(corner, type)
}

async function handleUndoLast() {
  if (!canScore.value) return
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
    <!-- Access check -->
    <div v-if="accessPending" class="text-center text-muted">
      Checking scoring access...
    </div>

    <div
      v-else-if="accessError"
      class="mx-auto max-w-lg rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-center"
    >
      <p class="font-semibold text-red-300">Access denied</p>
      <p class="mt-2 text-sm text-red-200/80">{{ accessError }}</p>
      <p class="mt-3 text-xs text-muted">Redirecting...</p>
    </div>

    <!-- Normal scoring UI only if allowed -->
    <template v-else-if="canScore">
      <div v-if="pending" class="text-center text-foreground/60">
        Loading match...
      </div>

      <div v-else-if="!match" class="text-center text-red-400">
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
        :notification-type="notificationType"
        @penalty="handlePenalty"
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
    </template>
  </div>
</template>