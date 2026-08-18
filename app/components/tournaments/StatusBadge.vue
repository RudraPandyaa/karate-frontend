<script setup lang="ts">
import type { TournamentDisplayStatus } from '~/types'

defineProps<{
  status: TournamentDisplayStatus
}>()

const badgeClasses: Record<TournamentDisplayStatus, string> = {
  UPCOMING:
    'bg-blue-500/15 text-blue-400 border border-blue-500/30',

  ONGOING:
    'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',

  DRAFT:
    'bg-amber-500/15 text-amber-400 border border-amber-500/30',

  COMPLETED:
    'bg-zinc-500/15 text-zinc-300 border border-zinc-500/30',

  CANCELLED:
    'bg-red-500/15 text-red-400 border border-red-500/30',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
    :class="badgeClasses[status]"
  >
    <span
      v-if="status === 'ONGOING'"
      class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"
    />
    <span
      v-else-if="status === 'UPCOMING'"
      class="h-2 w-2 rounded-full bg-blue-400"
    />
    <span
      v-else-if="status === 'DRAFT'"
      class="h-2 w-2 rounded-full bg-amber-400"
    />
    <span
      v-else-if="status === 'COMPLETED'"
      class="h-2 w-2 rounded-full bg-zinc-400"
    />
    <span
      v-else
      class="h-2 w-2 rounded-full bg-red-400"
    />

    {{ status }}
  </span>
</template>