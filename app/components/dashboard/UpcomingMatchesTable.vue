<script setup lang="ts">
import { Pencil, Eye } from 'lucide-vue-next'
import type { UpcomingMatchRow } from '~/types'

const props = defineProps<{
  matches: UpcomingMatchRow[]
  editable?: boolean  // <-- New prop
}>()

const emit = defineEmits<{
  edit: [match: UpcomingMatchRow]
}>()

const editMatch = (match: UpcomingMatchRow) => {
  emit('edit', match)
  // Or open a modal directly: useEditMatchModal(match)
}

const viewMatch = (match: UpcomingMatchRow) => {
  navigateTo(`/live-scoring/${match.id}`)
}
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
    <table class="w-full text-left">
      <thead>
        <tr class="border-b border-line bg-canvas/40">
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Match No</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Category</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Round</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Tatami</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Red (AKA)</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Blue (AO)</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="m in matches" :key="m.id" class="border-b border-line last:border-0 hover:bg-surface-hover transition-colors">
          <td class="px-5 py-4 text-sm font-semibold text-foreground whitespace-nowrap">{{ m.matchNo }}</td>
          <td class="px-5 py-4 text-sm text-foreground">{{ m.categoryName }}</td>
          <td class="px-5 py-4 text-sm text-muted">{{ m.round }}</td>
          <td class="px-5 py-4 text-foreground">
            <span class="rounded-md bg-canvas border border-line px-2 py-1 text-[11px] font-bold text-muted">
              TATAMI {{ m.tatamiNumber }}
            </span>
          </td>
          <td class="px-5 py-4 text-sm text-foreground">
            <span class="mr-2 inline-block h-2 w-2 rounded-full bg-aka align-middle" />
            {{ m.redAthlete.name }} <span class="text-muted">({{ m.redAthlete.country }})</span>
          </td>
          <td class="px-5 py-4 text-sm text-foreground">
            <span class="mr-2 inline-block h-2 w-2 rounded-full bg-ao align-middle" />
            {{ m.blueAthlete.name }} <span class="text-muted">({{ m.blueAthlete.country }})</span>
          </td>

          <td class="px-5 py-4">
            <div class="flex items-center justify-end gap-3">
              <!-- Edit button - ADMIN ONLY -->
              <button
                v-if="editable"
                @click="editMatch(m)"
                class="text-amber-400 hover:text-amber-300 transition-colors"
                aria-label="Edit match"
              >
                <Pencil class="h-4 w-4" />
              </button>

              <!-- View button - Everyone -->
              <button
                @click="viewMatch(m)"
                class="text-muted hover:text-foreground transition-colors"
                aria-label="View match"
              >
                <Eye class="h-4 w-4" />
              </button>
            </div>
          </td>
        </tr>

        <tr v-if="matches.length === 0">
          <td colspan="7" class="px-5 py-10 text-center text-sm text-muted">
            No upcoming matches scheduled.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>