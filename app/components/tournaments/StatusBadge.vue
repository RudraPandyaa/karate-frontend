<script setup lang="ts">
import type { TournamentDisplayStatus } from '~/types'

const props = defineProps<{ status: TournamentDisplayStatus }>()

const styles: Record<TournamentDisplayStatus, string> = {
  UPCOMING: 'bg-blue-600/15 text-blue-400 border-blue-600/30',
  LIVE: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  DRAFT: 'bg-white/10 text-muted border-line',
  COMPLETED: 'bg-white/10 text-muted border-line',
  CANCELLED: 'bg-rose-600/15 text-rose-400 border-rose-600/30',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-bold tracking-wide"
    :class="styles[props.status]"
  >
    <span v-if="status === 'LIVE'" class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
    {{ status }}
  </span>
</template>