<script setup lang="ts">
definePageMeta({
  layout: 'public',
})
const route = useRoute()
const matchId = route.params.id as string

const { match, pending, error, lastScoreFlash } = useLiveMatch(matchId)
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
    </template>
  </div>
</template>