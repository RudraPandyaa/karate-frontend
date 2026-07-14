<script setup lang="ts">
const props = defineProps<{
  discipline: 'KATA' | 'KUMITE' | 'TEAM_KATA' | 'TEAM_KUMITE'
}>()

const styles: Record<typeof props.discipline, string> = {
  KATA: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  KUMITE: 'bg-red-500/10 text-red-400 border-red-500/30',
  TEAM_KATA: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  TEAM_KUMITE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
}

const labels: Record<typeof props.discipline, string> = {
  KATA: 'Kata',
  KUMITE: 'Kumite',
  TEAM_KATA: 'Team Kata',
  TEAM_KUMITE: 'Team Kumite',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium"
    :class="styles[discipline]"
  >
    {{ labels[discipline] }}
  </span>
</template>