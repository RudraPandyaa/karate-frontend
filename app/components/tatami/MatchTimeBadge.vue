<script setup lang="ts">
import { Clock } from 'lucide-vue-next'
import { formatMatchTime } from '~/composables/useTatamiSchedule'

const props = defineProps<{
  estimatedStart: Date
  isFixedTime: boolean
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
    :class="props.isFixedTime ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'"
  >
    <Clock class="h-3 w-3" />
    {{ formatMatchTime(props.estimatedStart) }}
    <span v-if="!props.isFixedTime" class="opacity-70">(est.)</span>
  </span>
</template>