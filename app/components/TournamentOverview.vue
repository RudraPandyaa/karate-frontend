<script setup lang="ts">
import { computed } from 'vue'
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
    color: 'text-emerald-400',
  },
  {
    label: 'Categories',
    value: props.tournament?.categoriesCount ?? 0,
    icon: Target,
    color: 'text-blue-400',
  },
  {
    label: 'Matches',
    value: props.tournament?.matchesCount ?? 0,
    icon: Trophy,
    color: 'text-amber-400',
  },
  {
    label: 'Days Left',
    value: props.tournament?.startDate
      ? calculateDaysLeft(props.tournament.startDate)
      : 0,
    icon: Clock,
    color: 'text-purple-400',
  },
])

function calculateDaysLeft(startDate: string): number {
  const start = new Date(startDate)
  if (Number.isNaN(start.getTime())) return 0
  const now = new Date()
  const diffTime = start.getTime() - now.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 3600 * 24)))
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

const locationText = computed(
  () => props.tournament?.location?.trim() || '—',
)

const statusText = computed(
  () => props.tournament?.status || null,
)
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
    <div class="rounded-3xl border border-line bg-surface p-8 lg:col-span-2">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10">
          <Trophy class="h-8 w-8 text-blue-400" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-foreground">
            {{ tournament?.name || 'Tournament' }}
          </h2>
          <p
            v-if="statusText"
            class="mt-1 text-sm text-muted"
          >
            {{ statusText }}
          </p>
        </div>
      </div>

      <div class="mt-8 space-y-4">
        <div class="flex items-center gap-3 text-sm text-foreground">
          <MapPin class="h-5 w-5 text-muted" />
          <span>{{ locationText }}</span>
        </div>
        <div class="flex items-center gap-3 text-sm text-foreground">
          <Calendar class="h-5 w-5 text-muted" />
          <span>
            {{ formatDate(tournament?.startDate) }}
            —
            {{ formatDate(tournament?.endDate) }}
          </span>
        </div>
      </div>
    </div>

    <div
      v-for="(stat, i) in stats"
      :key="i"
      class="rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-blue-500/30"
    >
      <div class="flex items-center justify-between">
        <div :class="stat.color">
          <component
            :is="stat.icon"
            class="h-8 w-8"
          />
        </div>
        <div class="text-right">
          <div class="text-3xl font-bold text-foreground">
            {{ stat.value }}
          </div>
          <div class="mt-1 text-sm text-muted">
            {{ stat.label }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>