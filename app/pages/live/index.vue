<script setup lang="ts">
const { matches, pending, error } = useLiveMatches()
</script>

<template>
  <div class="min-h-screen bg-zinc-950 px-6 py-10">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">Live Matches</h1>

      <div v-if="pending" class="text-white/60 text-center py-20">
        Loading live matches...
      </div>

      <div v-else-if="error" class="text-red-400 text-center py-20">
        {{ error }}
      </div>

      <div v-else-if="matches.length === 0" class="text-center py-20">
        <p class="text-white/60 text-lg">No matches are live right now.</p>
        <p class="text-white/40 text-sm mt-2">This page checks automatically every few seconds.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <NuxtLink
          v-for="m in matches"
          :key="m.id"
          :to="`/live-scoring/${m.id}`"
          class="block rounded-2xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600 transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-xs font-bold text-white uppercase tracking-wide">
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

          <p class="text-sm text-white/60 mb-3">{{ m.category?.name }} • {{ m.round }}</p>

          <div class="flex items-center justify-between">
            <span class="text-white font-semibold truncate max-w-[40%]">
              {{ m.redAthlete?.name ?? 'TBD' }}
            </span>
            <span class="text-white font-mono text-lg">
              {{ m.redScore }} - {{ m.blueScore }}
            </span>
            <span class="text-white font-semibold truncate max-w-[40%] text-right">
              {{ m.blueAthlete?.name ?? 'TBD' }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>