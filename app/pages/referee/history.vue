<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRefereeMatches } from '~/composables/useRefereeMatches'
import { athleteDisplayName } from '~/composables/useMatches'

definePageMeta({
  layout: 'default',
  middleware: 'referee',
})

const { matches, pending, error, fetchAssignedToReferee } = useRefereeMatches()

onMounted(() => {
  fetchAssignedToReferee()
})

const completedMatches = computed(() =>
  matches.value.filter((m) => m.status === 'COMPLETED'),
)
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">Match History</h1>
      <p class="mt-1 text-sm text-muted">
        Past matches you have officiated
      </p>
    </div>

    <div v-if="pending" class="text-muted">Loading...</div>
    <div v-else-if="error" class="text-red-400">{{ error }}</div>

    <div
      v-else-if="completedMatches.length === 0"
      class="rounded-xl border border-line bg-surface p-8 text-center"
    >
      <p class="text-sm text-muted">No match history yet.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="m in completedMatches"
        :key="m.id"
        class="rounded-xl border border-line bg-surface p-4"
      >
        <p class="font-medium text-foreground">
          {{ athleteDisplayName(m.redAthlete) }}
          vs
          {{ athleteDisplayName(m.blueAthlete) }}
        </p>
        <p class="mt-1 text-sm text-muted">
          {{ m.category?.name || 'Category' }}
          · {{ m.round }}
          · Score {{ m.redScore }} - {{ m.blueScore }}
        </p>
      </div>
    </div>
  </div>
</template>