<script setup lang="ts">
import { computed } from 'vue'
import { CalendarDays, MapPin, Users, Layers } from 'lucide-vue-next'
import StatusBadge from '~/components/tournaments/StatusBadge.vue'
import type { TournamentRow } from '~/types'

const props = defineProps<{
  rows: TournamentRow[]
  search: string
}>()

const filteredRows = computed(() => {
  const keyword = props.search.trim().toLowerCase()

  if (!keyword) return props.rows

  return props.rows.filter((tournament) => {
    return (
      tournament.name.toLowerCase().includes(keyword) ||
      tournament.location.toLowerCase().includes(keyword) ||
      tournament.subtitle.toLowerCase().includes(keyword)
    )
  })
})

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
    <div
      v-if="filteredRows.length === 0"
      class="py-20 text-center"
    >
      <h3 class="text-lg font-semibold text-white">
        No tournaments found
      </h3>

      <p class="mt-2 text-muted">
        Try another search or create a new tournament.
      </p>
    </div>

    <!-- Table -->
    <table
      v-else
      class="min-w-full"
    >
      <thead class="border-b border-line bg-surface">
        <tr class="text-left text-sm text-muted">

          <th class="px-6 py-4 font-medium">
            Tournament
          </th>

          <th class="px-6 py-4 font-medium">
            Status
          </th>

          <th class="px-6 py-4 font-medium">
            Dates
          </th>

          <th class="px-6 py-4 font-medium">
            Categories
          </th>

          <th class="px-6 py-4 font-medium">
            Athletes
          </th>

          <th class="px-6 py-4 font-medium">
            Actions
          </th>

        </tr>
      </thead>

      <tbody>

        <tr
          v-for="tournament in filteredRows"
          :key="tournament.id"
          class="border-b border-line transition hover:bg-surface/50"
        >

          <!-- Tournament -->
          <td class="px-6 py-5">

            <div class="font-semibold text-white">
              {{ tournament.name }}
            </div>

            <div class="mt-1 text-sm text-muted">
              {{ tournament.subtitle }}
            </div>

            <div
              class="mt-2 flex items-center gap-2 text-xs text-muted"
            >
              <MapPin class="h-4 w-4" />
              {{ tournament.location }}
            </div>

          </td>

          <!-- Status -->
          <td class="px-6 py-5">
            <StatusBadge :status="tournament.displayStatus" />
          </td>

          <!-- Dates -->
          <td class="px-6 py-5">

            <div class="flex items-center gap-2 text-sm">
              <CalendarDays class="h-4 w-4 text-muted" />

              <div>
                <div>{{ formatDate(tournament.startDate) }}</div>

                <div class="text-xs text-muted">
                  to {{ formatDate(tournament.endDate) }}
                </div>
              </div>

            </div>

          </td>

          <!-- Categories -->
          <td class="px-6 py-5">

            <div class="flex items-center gap-2">

              <Layers class="h-4 w-4 text-blue-400" />

              {{ tournament.categoriesCount }}

            </div>

          </td>

          <!-- Athletes -->
          <td class="px-6 py-5">

            <div class="flex items-center gap-2">

              <Users class="h-4 w-4 text-emerald-400" />

              {{ tournament.athletesCount }}

            </div>

          </td>

          <!-- Actions -->
          <td class="px-6 py-5">

            <div class="flex gap-2">

              <NuxtLink
                :to="`/tournaments/${tournament.id}`"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
              >
                View
              </NuxtLink>

              <NuxtLink
                :to="`/tournaments/${tournament.id}/dashboard`"
                class="rounded-lg border border-line px-4 py-2 text-sm transition hover:bg-surface"
              >
                Dashboard
              </NuxtLink>

            </div>

          </td>

        </tr>

      </tbody>
    </table>

  </div>
</template>