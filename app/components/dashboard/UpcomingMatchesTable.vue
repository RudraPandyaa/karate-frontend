<script setup lang="ts">
import { Pencil, Eye } from 'lucide-vue-next'
import CountryFlag from 'vue-country-flag-next'
import type { UpcomingMatchRow } from '~/types'
import { COUNTRY_CODE_MAP } from '~/utils/countries'

const props = defineProps<{
  matches: UpcomingMatchRow[]
  editable?: boolean
}>()

const emit = defineEmits<{
  edit: [match: UpcomingMatchRow]
}>()

function iso2(code?: string) {
  if (!code) return ''
  const upper = code.trim().toUpperCase()
  if (upper.length === 2) return upper
  return COUNTRY_CODE_MAP[upper] || ''
}

const editMatch = (match: UpcomingMatchRow) => {
  emit('edit', match)
}

const viewMatch = (match: UpcomingMatchRow) => {
  navigateTo(`/live-scoring/${match.id}`)
}
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
    <table class="w-full table-fixed text-left">
      <thead>
        <tr class="border-b border-line bg-canvas/40">
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Match No</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Category</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Round</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Tatami</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted min-w-[180px]">
            Red (AKA)
          </th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted min-w-[180px]">
            Blue (AO)
          </th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted text-right">
            Actions
          </th>
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
            <div class="flex min-w-[180px] items-center gap-2">
              <span class="h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <span class="truncate font-medium">{{ m.redAthlete.name }}</span>
              <CountryFlag
                v-if="iso2(m.redAthlete.country)"
                :country="iso2(m.redAthlete.country)"
                size="small"
                class="shrink-0"
              />
            </div>
          </td>

          <td class="px-5 py-4 text-sm text-foreground">
            <div class="flex min-w-[180px] items-center gap-2">
              <span class="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
              <span class="truncate font-medium">{{ m.blueAthlete.name }}</span>
              <CountryFlag
                v-if="iso2(m.blueAthlete.country)"
                :country="iso2(m.blueAthlete.country)"
                size="small"
                class="shrink-0"
              />
            </div>
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