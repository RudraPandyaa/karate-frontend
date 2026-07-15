<script setup lang="ts">
const { matches, pending, error } = useLiveMatches()
</script>

<template>
  <div class="min-h-screen bg-canvas px-6 py-10">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold text-foreground mb-8">Live Matches</h1>

      <div v-if="pending" class="text-muted text-center py-20">
        Loading live matches...
      </div>

      <div v-else-if="error" class="text-red-400 text-center py-20">
        {{ error }}
      </div>

      <div v-else-if="matches.length === 0" class="text-center py-20">
        <p class="text-muted text-lg">No matches are live right now.</p>
        <p class="text-muted text-sm mt-2">This page checks automatically every few seconds.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <NuxtLink
          v-for="m in matches"
          :key="m.id"
          :to="`/live-scoring/${m.id}`"
          class="block rounded-2xl border border-line bg-panel p-5 hover:border-primary/40 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-foreground uppercase tracking-wide">
              Tatami {{ m.tatami?.number ?? '-' }}
            </span>
           <span
            class="flex items-center gap-1.5 text-xs font-medium"
            :class="m.status === 'IN_PROGRESS' ? 'text-green-400' : 'text-yellow-400'"
            >
            <span
                class="h-2 w-2 rounded-full"
                :class="m.status === 'IN_PROGRESS' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'"
            />
            {{ m.status === 'IN_PROGRESS' ? 'Live' : 'Paused' }}
            </span>
          </div>

          <p class="text-sm text-muted mb-3">{{ m.category?.name }} • {{ m.round }}</p>

          <div class="flex items-center justify-between">
            <span class="text-foreground font-semibold truncate max-w-[40%]">
              {{ m.redAthlete?.name ?? 'TBD' }}
            </span>
            <span class="text-foreground font-mono text-lg">
              {{ m.redScore }} - {{ m.blueScore }}
            </span>
            <span class="text-foreground font-semibold truncate max-w-[40%] text-right">
              {{ m.blueAthlete?.name ?? 'TBD' }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>