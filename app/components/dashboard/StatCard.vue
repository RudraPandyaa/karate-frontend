<script setup lang="ts">
import { TrendingUp, type LucideIcon } from 'lucide-vue-next'

defineProps<{
  label: string
  value: string | number
  icon: LucideIcon
  footnote: string
  trendPct?: number
}>()
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface p-5 shadow-card">
    <div class="flex items-start justify-between">
      <p class="text-sm font-medium text-muted">{{ label }}</p>
      <div class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-canvas border border-line">
        <component :is="icon" class="h-5 w-5 text-blue-400" />
      </div>
    </div>

    <p class="mt-3 text-3xl font-extrabold tabular text-foreground">{{ value }}</p>

    <p class="mt-1.5 flex items-center gap-1 text-xs text-muted">
      <TrendingUp v-if="trendPct" class="h-3.5 w-3.5 text-emerald-400" />
      <span v-if="trendPct" class="font-medium text-emerald-400">+{{ trendPct }}%</span>
      {{ footnote }}
    </p>
  </div>
</template>
