<script setup lang="ts">
import { Calendar, MapPin, Users, Trophy, Clock, Target } from 'lucide-vue-next'
import type { Tournament } from '~/types'

const props = defineProps<{
  tournament: Tournament | null
  athletesCount: number
}>()

const stats = computed(() => [
  {
    label: 'Total Athletes',
    value: props.athletesCount.toLocaleString(),
    icon: Users,
    color: 'text-emerald-400'
  },
  {
    label: 'Categories',
    value: props.tournament?.categoriesCount ?? 0,
    icon: Target,
    color: 'text-blue-400'
  },
  {
    label: 'Matches',
    value: props.tournament?.matchesCount ?? 0,
    icon: Trophy,
    color: 'text-amber-400'
  },
  {
    label: 'Days Left',
    value: props.tournament ? calculateDaysLeft(props.tournament.startDate) : 0,
    icon: Clock,
    color: 'text-purple-400'
  }
])

function calculateDaysLeft(startDate: string): number {
  const start = new Date(startDate)
  const now = new Date()
  const diffTime = start.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 3600 * 24)))
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <!-- Main Info Card -->
    <div class="lg:col-span-2 bg-surface border border-line rounded-3xl p-8">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Trophy class="w-8 h-8 text-blue-400" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-foreground">{{ tournament?.name }}</h2>
          <p class="text-muted mt-1">{{ tournament?.subtitle }}</p>
        </div>
      </div>

      <div class="mt-8 space-y-4">
        <div class="flex items-center gap-3 text-sm">
          <MapPin class="w-5 h-5 text-muted" />
          <span>{{ tournament?.location }}</span>
        </div>
        <div class="flex items-center gap-3 text-sm">
          <Calendar class="w-5 h-5 text-muted" />
          <span>
            {{ new Date(tournament?.startDate).toLocaleDateString('en-GB', { month: 'long', day: 'numeric' }) }}
            —
            {{ new Date(tournament?.endDate).toLocaleDateString('en-GB', { month: 'long', day: 'numeric', year: 'numeric' }) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div
      v-for="(stat, i) in stats"
      :key="i"
      class="bg-surface border border-line rounded-3xl p-6 hover:border-blue-500/30 transition-colors"
    >
      <div class="flex items-center justify-between">
        <div :class="stat.color">
          <component :is="stat.icon" class="w-8 h-8" />
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold text-foreground">{{ stat.value }}</div>
          <div class="text-sm text-muted mt-1">{{ stat.label }}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Description / Notes -->
  <div v-if="tournament?.description" class="mt-10">
    <h3 class="text-lg font-semibold mb-3">About Tournament</h3>
    <div class="bg-surface border border-line rounded-3xl p-8 text-muted leading-relaxed">
      {{ tournament.description }}
    </div>
  </div>
</template>