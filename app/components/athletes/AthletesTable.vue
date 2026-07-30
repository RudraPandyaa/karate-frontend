<script setup lang="ts">
import { computed } from 'vue'
import type { Athlete } from '~/composables/useAthletes'
import CountryFlag from 'vue-country-flag-next'
import { COUNTRY_CODE_MAP } from '~/utils/countries'

const props = defineProps<{
  athletes: Athlete[]
  loading?: boolean
  search?: string
}>()

const emit = defineEmits<{
  (e: 'view', athlete: Athlete): void
  (e: 'edit', athlete: Athlete): void
  (e: 'delete', athlete: Athlete): void
}>()

function getDisplayName(athlete: Athlete) {
  return (
    athlete.fullName ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    '—'
  )
}

const filtered = computed(() => {
  const q = (props.search || '').trim().toLowerCase()
  if (!q) return props.athletes

  return props.athletes.filter((a) => {
    const name = getDisplayName(a).toLowerCase()
    return (
      name.includes(q) ||
      a.state?.toLowerCase().includes(q) ||
      a.country?.toLowerCase().includes(q) ||
      a.phone?.toLowerCase().includes(q)
    )
  })
})
</script>

<template>
  <div class="bg-surface border border-line rounded-2xl overflow-hidden">
    <!-- Loading -->
    <div v-if="loading" class="py-16 text-center text-muted">
      Loading athletes...
    </div>

    <!-- Empty -->
    <div v-else-if="filtered.length === 0" class="py-16 text-center text-muted">
      No athletes found.
    </div>

    <!-- Table -->
    <table v-else class="w-full">
      <thead class="bg-canvas/60">
        <tr>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
            Athlete
          </th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
            Country
          </th>
          <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
            Categories
          </th>
          <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">
            Actions
          </th>
        </tr>
      </thead>

      <tbody>
        <tr
          v-for="athlete in filtered"
          :key="athlete.id"
          class="border-t border-line hover:bg-surface-hover transition"
        >
          <!-- Athlete (photo + name + state) -->
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl overflow-hidden bg-canvas border border-line shrink-0">
                <img
                  v-if="athlete.photoUrl"
                  :src="athlete.photoUrl"
                  :alt="getDisplayName(athlete)"
                  class="w-full h-full object-cover"
                />
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center text-xs font-semibold text-muted"
                >
                  {{ getDisplayName(athlete).charAt(0).toUpperCase() }}
                </div>
              </div>

              <div class="min-w-0">
                <p class="font-medium text-foreground truncate">
                  {{ getDisplayName(athlete) }}
                </p>
                <p class="text-sm text-muted truncate">
                  {{ athlete.state || '—' }}
                </p>
              </div>
            </div>
          </td>

          <!-- Country -->
          <td class="px-6 py-4">
            <div class="flex items-center gap-2">
              <CountryFlag
                v-if="COUNTRY_CODE_MAP[athlete.country]"
                :country="COUNTRY_CODE_MAP[athlete.country]"
                size="small"
              />
              <span class="text-sm text-muted">
                {{ athlete.country || '—' }}
              </span>
            </div>
          </td>

          <!-- Categories count -->
          <td class="px-6 py-4 text-sm text-muted">
            {{ athlete._count?.categories ?? 0 }} enrolled
          </td>

          <!-- Actions -->
          <td class="px-6 py-4 text-right space-x-3">
            <button
              class="text-blue-400 hover:text-blue-300 text-sm"
              @click="emit('view', athlete)"
            >
              View
            </button>
            <button
              class="text-muted hover:text-foreground text-sm"
              @click="emit('edit', athlete)"
            >
              Edit
            </button>
            <button
              class="text-red-400 hover:text-red-300 text-sm"
              @click="emit('delete', athlete)"
            >
              Delete
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>