<script setup lang="ts">
definePageMeta({
  middleware: 'scorekeeper',
})
const route = useRoute()
const matchId = route.params.id as string
const { match, pending, error } = useLiveMatch(matchId)
const {
  submitting,
  submitError,
  recordScore,
  undoScore,
  startTimer,
  pauseTimer,
  adjustTime,
  timer,
  notification,
  matchStatus
} = useScoringAdmin(matchId)

const lastScoreEventId = ref<string | null>(null)

async function handleScore(corner: 'RED' | 'BLUE', type: 'YUKO' | 'WAZA_ARI' | 'IPPON') {
  const result: any = await recordScore(corner, type)
  const events = result?.scoreEvents
  if (events?.length) {
    lastScoreEventId.value = events[events.length - 1].id
  }
}

async function handleUndoLast() {
  if (!lastScoreEventId.value) return
  await undoScore(lastScoreEventId.value)
  lastScoreEventId.value = null
}
</script>

<template>
  <div class="min-h-screen bg-canvas py-10 px-6">
    <div v-if="pending" class="text-center text-foreground/60">Loading match...</div>
    <div v-else-if="error" class="text-center text-red-400">{{ error }}</div>
    <MatchesScoringControls
        v-else-if="match"
        :match="match"
        :timer="timer"
        :notification="notification"
        :match-status="matchStatus"
        :submitting="submitting"
        :submit-error="submitError"
        :can-undo="!!lastScoreEventId"
        @score="handleScore"
        @undo-last="handleUndoLast"
        @start="startTimer"
        @pause="pauseTimer"
        @adjust-time="adjustTime"
    />
  </div>
</template>