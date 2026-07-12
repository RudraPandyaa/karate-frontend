<script setup lang="ts">
import { Pencil, Eye, ChevronLeft, ChevronRight, MapPin } from 'lucide-vue-next'
import type { TournamentRow } from '~/types'

const props = defineProps<{
  rows: TournamentRow[]
  search: string
  pageSize?: number
}>()

const pageSize = computed(() => props.pageSize ?? 3) // matches the screenshot's "Showing 1-3 of 12"
const page = ref(1)

const filtered = computed(() => {
  const q = props.search.trim().toLowerCase()
  if (!q) return props.rows
  return props.rows.filter((r) => r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q))
})

// Reset to page 1 whenever the search term changes so results aren't hidden
// on a page that no longer exists.
watch(
  () => props.search,
  () => (page.value = 1),
)

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)))
const pageStart = computed(() => (filtered.value.length === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
const pageEnd = computed(() => Math.min(page.value * pageSize.value, filtered.value.length))
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

function initials(name: string) {
  return name.trim().charAt(0).toUpperCase()
}

function formatDateRange(startISO: string, endISO: string) {
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
  const start = new Date(startISO)
  const end = new Date(endISO)
  return `${fmt(start)} - ${fmt(end)}, ${end.getFullYear()}`
}
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
    <table class="w-full text-left">
      <thead>
        <tr class="border-b border-line bg-canvas/40">
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Tournament Name</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Location</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Date Range</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Status</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Categories</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted">Athletes</th>
          <th class="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="t in pageRows"
          :key="t.id"
          class="border-b border-line last:border-0 hover:bg-surface-hover transition-colors align-top"
        >
          <td class="px-5 py-4">
            <div class="flex items-start gap-3">
              <div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-canvas border border-line text-sm font-bold text-white">
                {{ initials(t.name) }}
              </div>
              <div>
                <p class="text-sm font-semibold text-white leading-snug">{{ t.name }}</p>
                <p class="text-xs text-muted mt-0.5">{{ t.subtitle }}</p>
              </div>
            </div>
          </td>
          <td class="px-5 py-4 text-sm text-white/90">
            <span class="inline-flex items-center gap-1.5">
              <MapPin class="h-3.5 w-3.5 text-muted shrink-0" />
              {{ t.location }}
            </span>
          </td>
          <td class="px-5 py-4 text-sm text-white/90">{{ formatDateRange(t.startDate, t.endDate) }}</td>
          <td class="px-5 py-4"><TournamentsStatusBadge :status="t.displayStatus" /></td>
          <td class="px-5 py-4 text-sm text-white/90">{{ t.categoriesCount }} Categories</td>
          <td class="px-5 py-4 text-sm font-semibold text-white">{{ t.athletesCount.toLocaleString() }}</td>
          <td class="px-5 py-4">
            <div class="flex items-center justify-end gap-3">
              <button class="text-muted hover:text-white transition-colors" aria-label="Edit tournament">
                <Pencil class="h-4 w-4" />
              </button>
              <NuxtLink :to="`/tournaments/${t.id}`" class="text-muted hover:text-white transition-colors" aria-label="View tournament">
                <Eye class="h-4 w-4" />
              </NuxtLink>
            </div>
          </td>
        </tr>

        <tr v-if="pageRows.length === 0">
          <td colspan="7" class="px-5 py-10 text-center text-sm text-muted">
            No tournaments match "{{ search }}".
          </td>
        </tr>
      </tbody>
    </table>

    <div class="flex items-center justify-between border-t border-line px-5 py-4">
      <p class="text-sm text-muted">
        Showing {{ pageStart }}-{{ pageEnd }} of {{ filtered.length }} tournaments
      </p>
      <div class="flex items-center gap-2">
        <button
          class="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-canvas hover:text-white disabled:opacity-40 disabled:pointer-events-none"
          :disabled="page === 1"
          aria-label="Previous page"
          @click="page--"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>
        <button
          class="grid h-8 w-8 place-items-center rounded-lg border border-line text-muted transition-colors hover:bg-canvas hover:text-white disabled:opacity-40 disabled:pointer-events-none"
          :disabled="page === totalPages"
          aria-label="Next page"
          @click="page++"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
</template>