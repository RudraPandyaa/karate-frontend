<script setup lang="ts">
defineProps<{
  match?: {
    id: string
    round?: string
    status?: string

    redAthlete?: {
      id: string
      name: string
    }

    blueAthlete?: {
      id: string
      name: string
    }

    category?: {
      id: string
      name: string
    }
  } | null

  loading?: boolean
}>()
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

        <span
          class="rounded-full bg-green-600/20 px-3 py-1 text-xs font-semibold text-green-400"
        >
          {{ match.status }}
        </span>
      </div>

      <div
        v-if="match.category"
        class="mb-5 text-sm text-muted"
      >
        {{ match.category.name }}
      </div>

      <div class="grid grid-cols-3 items-center gap-3">
        <div class="text-center">
          <div class="text-sm text-muted mb-2">
            AKA
          </div>

          <div class="font-semibold text-red-400">
            {{ match.redAthlete?.name || 'TBD' }}
          </div>
        </div>

        <div
          class="text-center text-xl font-bold text-muted"
        >
          VS
        </div>

        <div class="text-center">
          <div class="text-sm text-muted mb-2">
            AO
          </div>

          <div class="font-semibold text-blue-400">
            {{ match.blueAthlete?.name || 'TBD' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>