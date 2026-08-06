<script setup lang="ts">
import { getFlagEmoji } from '~/utils/countries'
import MatchTimeBadge from '~/components/tatami/MatchTimeBadge.vue'

defineProps<{
  match?: {
    id: string
    round?: string
    status?: string
    redAthlete?: {
      id: string
      firstName?: string | null
      lastName?: string | null
      fullName?: string | null
      name?: string | null
      country?: string | null
    } | null
    blueAthlete?: {
      id: string
      firstName?: string | null
      lastName?: string | null
      fullName?: string | null
      name?: string | null
      country?: string | null
    } | null
    category?: {
      id: string
      name: string
    } | null
  } | null
  loading?: boolean
  /** Estimated (or explicit) start time for this match on its tatami. */
  estimatedStart?: Date | null
  /** true if estimatedStart came from the match's own scheduledTime, not a cascade estimate. */
  isFixedTime?: boolean
}>()

function athleteName(a?: {
  fullName?: string | null
  name?: string | null
  firstName?: string | null
  lastName?: string | null
} | null) {
  if (!a) return 'TBD'
  return (
    a.fullName ||
    a.name ||
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}
</script>

<template>
  <div
    class="rounded-2xl border border-line bg-canvas p-5 transition"
  >
    <!-- Loading -->
    <div
      v-if="loading"
      class="py-8 text-center text-sm text-muted"
    >
      Loading current match...
    </div>

    <!-- No Match -->
    <div
      v-else-if="!match"
      class="py-8 text-center text-sm text-muted"
    >
      No match currently running
    </div>

    <!-- Current Match -->
    <div v-else>
      <div class="flex items-center justify-between mb-4">
        <span
          class="rounded-full bg-blue-600/20 px-3 py-1 text-xs font-semibold text-blue-400"
        >
          {{ match.round || 'Round' }}
        </span>

        <div class="flex items-center gap-2">
          <MatchTimeBadge
            v-if="estimatedStart"
            :estimated-start="estimatedStart"
            :is-fixed-time="!!isFixedTime"
          />
          <span
            class="rounded-full bg-green-600/20 px-3 py-1 text-xs font-semibold text-green-400"
          >
            {{ match.status }}
          </span>
        </div>
      </div>

      <div
        v-if="match.category"
        class="mb-5 text-sm text-muted"
      >
        {{ match.category.name }}
      </div>

      <div class="grid grid-cols-3 items-center gap-3">
            <div class="text-center">
              <div class="text-sm text-muted mb-2">AKA</div>
              <div class="font-semibold text-red-400">
                <span v-if="match.redAthlete?.country" class="mr-1">
                  {{ getFlagEmoji(match.redAthlete.country) }}
                </span>
                {{ athleteName(match.redAthlete) }}
              </div>
            </div>

            <div class="text-center text-xl font-bold text-muted">VS</div>

            <div class="text-center">
              <div class="text-sm text-muted mb-2">AO</div>
              <div class="font-semibold text-blue-400">
                <span v-if="match.blueAthlete?.country" class="mr-1">
                  {{ getFlagEmoji(match.blueAthlete.country) }}
                </span>
                {{ athleteName(match.blueAthlete) }}
              </div>
            </div>
      </div>
      </div>
  </div>
</template>