<script setup lang="ts">
defineProps<{
  stats?: {
    matches?: number
    wins?: number
    losses?: number
    winRate?: number
    pointsScored?: number
    pointsConceded?: number
  } | null
  upcomingCount?: number
  categoriesCount?: number
}>()
</script>

<template>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    <!-- Wins -->
    <div class="rounded-2xl border border-line bg-surface p-4">
      <p class="text-xs uppercase tracking-wide text-muted">Wins</p>
      <p class="mt-2 text-2xl font-bold text-green-400">
        {{ stats?.wins ?? 0 }}
      </p>
    </div>

    <!-- Losses -->
    <div class="rounded-2xl border border-line bg-surface p-4">
      <p class="text-xs uppercase tracking-wide text-muted">Losses</p>
      <p class="mt-2 text-2xl font-bold text-red-400">
        {{ stats?.losses ?? 0 }}
      </p>
    </div>

    <!-- Win Rate -->
    <div class="rounded-2xl border border-line bg-surface p-4">
      <p class="text-xs uppercase tracking-wide text-muted">Win Rate</p>
      <p class="mt-2 text-2xl font-bold text-foreground">
        {{ stats?.winRate ?? 0 }}%
      </p>
    </div>

    <!-- Upcoming -->
    <div class="rounded-2xl border border-line bg-surface p-4">
      <p class="text-xs uppercase tracking-wide text-muted">Upcoming</p>
      <p class="mt-2 text-2xl font-bold text-blue-400">
        {{ upcomingCount ?? 0 }}
      </p>
    </div>
  </div>
</template>