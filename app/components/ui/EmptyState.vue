<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="rounded-3xl border border-line bg-surface px-6 py-16 text-center">
    <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/15 text-sm font-black text-blue-400">
      K
    </div>

    <h3 class="text-lg font-semibold text-foreground">
      {{ title }}
    </h3>

    <p
      v-if="description"
      class="mx-auto mt-2 max-w-md text-sm text-muted"
    >
      {{ description }}
    </p>

    <div v-if="$slots.actions" class="mt-5">
      <slot name="actions" />
    </div>
  </div>
</template>