<script setup lang="ts">
const { matches, pending, error, fetchAll } = useMatches()

onMounted(fetchAll)

const statusColor = (status: string) => {
  if (status === 'IN_PROGRESS') return 'text-green-400'
  if (status === 'PAUSED') return 'text-yellow-400'
  if (status === 'COMPLETED') return 'text-blue-400'
  return 'text-white/50'
}
</script>

<template>
  <div class="min-h-screen bg-zinc-950 px-6 py-10">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold text-white mb-8">All Matches</h1>

      <div v-if="pending" class="text-white/60 text-center py-20">Loading matches...</div>
      <div v-else-if="error" class="text-red-400 text-center py-20">{{ error }}</div>
      <div v-else-if="matches.length === 0" class="text-white/60 text-center py-20">
        No matches found.
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="m in matches"
          :key="m.id"
          :to="`/live-scoring/${m.id}`"
          class="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 hover:border-zinc-600 transition-colors"
        >
          <div>
            <p class="text-white font-semibold">
              {{ m.redAthlete?.name ?? 'TBD' }} vs {{ m.blueAthlete?.name ?? 'TBD' }}
            </p>
            <p class="text-sm text-white/50">
              {{ m.category?.name }} • {{ m.round }}
            </p>
          </div>
          <div class="text-right">
            <p class="font-mono text-white">{{ m.redScore }} - {{ m.blueScore }}</p>
            <p class="text-xs font-medium" :class="statusColor(m.status)">{{ m.status }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>