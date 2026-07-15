<script setup lang="ts">
const props = defineProps<{
  gender: 'MALE' | 'FEMALE' | 'MIXED'
}>()

const styles: Record<typeof props.gender, string> = {
  MALE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  FEMALE: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  MIXED: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
}

const labels: Record<typeof props.gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  MIXED: 'Mixed',
}
</script>

<template>
  <span
    class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium capitalize border-line"
    :class="styles[gender]"
  >
    {{ labels[gender] }}
  </span>
</template>