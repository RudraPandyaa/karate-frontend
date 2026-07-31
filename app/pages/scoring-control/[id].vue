<script setup lang="ts">
definePageMeta({
  middleware: 'scorekeeper',
})

const route = useRoute()

const matchId =
  route.params.id as string

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
} = useScoringAdmin(matchId)

// const lastScoreEventId =
//   ref<string | null>(null)

function handleScore(corner: 'RED' | 'BLUE', type: 'YUKO' | 'WAZA_ARI' | 'IPPON') {
  recordScore(corner, type)
}

async function handleUndoLast() {
  if (!lastScoreEventId.value) {
    alert('No score to undo')
    return
  }

  await undoScore(lastScoreEventId.value)
}
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
      :notification-type="notificationType"
      @score="handleScore"
      @undo-last="handleUndoLast"
      @start="startTimer"
      @pause="pauseTimer"
      @adjust-time="adjustTime"
    />

  </div>
</template>