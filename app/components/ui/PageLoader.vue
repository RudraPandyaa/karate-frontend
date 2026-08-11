<script setup lang="ts">
import KarateLoader from '~/components/ui/KarateLoader.vue'

defineProps<{
  text?: string
}>()
</script>

<template>
  <div class="rounded-3xl border border-line bg-surface">
    <KarateLoader :text="text" />
  </div>
</template>