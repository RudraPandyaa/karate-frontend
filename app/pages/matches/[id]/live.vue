<script setup lang="ts">
const route = useRoute()
const matchId = route.params.id as string

const { match, pending, error } = useLiveMatch(matchId)
</script>

<template>
  <div class="min-h-screen bg-black">

    <div
      v-if="pending"
      class="flex min-h-screen items-center justify-center text-white/60"
    >
      Loading match...
    </div>

    <div
      v-else-if="error"
      class="flex min-h-screen items-center justify-center text-red-400"
    >
      {{ error }}
    </div>

    <Scoreboard
      v-else-if="match"
      :match="match"
    />

  </div>
</template>