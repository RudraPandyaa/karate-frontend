<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, MapPin, Users, Layers, Pencil } from 'lucide-vue-next'
import StatusBadge from '~/components/tournaments/StatusBadge.vue'
import type { TournamentRow } from '~/types'

const props = defineProps<{
  rows: TournamentRow[]
  search: string
  showActions?: boolean   // ← New prop
}>()

const emit = defineEmits<{
  (e: 'edit', tournament: TournamentRow): void
}>()

// const filteredRows = computed(() => {
//   const keyword = props.search.trim().toLowerCase()
//   if (!keyword) return props.rows

//   return props.rows.filter((tournament) => {
//     return (
//       (tournament.name ?? '').toLowerCase().includes(keyword) ||
//       (tournament.location ?? '').toLowerCase().includes(keyword) ||
//       (tournament.subtitle ?? '').toLowerCase().includes(keyword)
//     )
//   })
// })

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}
</script>

<template>
  <div class="overflow-hidden rounded-3xl border border-line bg-panel">
    <!-- Empty State -->
    <div v-if="props.rows.length === 0" class="py-20 text-center">
      <h3 class="text-lg font-semibold text-foreground">No tournaments found</h3>
      <p class="mt-2 text-muted">Try another search or create a new tournament.</p>
    </div>

    <!-- Table -->
    <table v-else class="min-w-full">
      <thead class="border-b border-line bg-surface">
        <tr class="text-left text-sm text-muted">
          <th class="px-6 py-4 font-medium text-foreground">Tournament</th>
          <th class="px-6 py-4 font-medium text-foreground">Status</th>
          <th class="px-6 py-4 font-medium text-foreground">Dates</th>
          <th class="px-6 py-4 font-medium text-foreground">Categories</th>
          <th class="px-6 py-4 font-medium text-foreground">Athletes</th>
          <th class="px-6 py-4 font-medium text-foreground text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="tournament in props.rows"
          :key="tournament.id"
          class="border-b border-line transition hover:bg-surface/50"
        >
          <!-- Tournament Info -->
          <td class="px-6 py-5">
            <div class="font-semibold text-foreground">
              {{ tournament.name }}
            </div>
            <div class="mt-2 flex items-center gap-2 text-xs text-muted">
              <MapPin class="h-4 w-4" />
              {{ tournament.location || '—' }}
            </div>
          </td>

          <td class="px-6 py-5">
            <StatusBadge :status="tournament.displayStatus" />
          </td>

          <td class="px-6 py-5">
            <div class="flex items-center gap-2 text-sm">
              <CalendarDays class="h-4 w-4 text-muted" />
              <div>
                <div>{{ formatDate(tournament.startDate) }}</div>
                <div class="text-xs text-muted">to {{ formatDate(tournament.endDate) }}</div>
              </div>
            </div>
          </td>

          <td class="px-6 py-5">
            <div class="flex items-center gap-2">
              <Layers class="h-4 w-4 text-blue-400" />
              {{ tournament.categoriesCount }}
            </div>
          </td>

          <td class="px-6 py-5">
            <div class="flex items-center gap-2">
              <Users class="h-4 w-4 text-emerald-400" />
              {{ tournament.athletesCount }}
            </div>
          </td>

          <!-- Actions -->
          <td class="px-6 py-5 text-right">
            <div class="flex items-center justify-end gap-3">
              <!-- View Button - Everyone -->
              <NuxtLink
                :to="`/tournaments/${tournament.id}`"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
              >
                View
              </NuxtLink>

        

              <!-- Edit Button - Staff Only -->
              <button
                v-if="showActions"
                @click="emit('edit', tournament)"
                class="rounded-lg border border-line p-3 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300 transition"
                title="Edit Tournament"
              >
                <Pencil class="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>