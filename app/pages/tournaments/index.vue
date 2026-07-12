<script setup lang="ts">
import { Plus, Search, Filter, Download, CalendarPlus, ShieldCheck } from 'lucide-vue-next'

const { rows, stats, usingMockData, pending, error, fetchAll, createTournament } = useTournamentsData()

const search = ref('')
const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)

onMounted(() => {
  fetchAll()
})

async function handleCreate(payload: Parameters<typeof createTournament>[0]) {
  creating.value = true
  createError.value = null
  try {
    await createTournament(payload)
    showCreateModal.value = false
  } catch (e) {
    // Expected to 401 until real auth/login exists — see conversation notes.
    createError.value = e instanceof Error ? e.message : 'Failed to create tournament'
  } finally {
    creating.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <div
      v-if="usingMockData"
      class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300"
    >
      Showing mock data — backend not reachable yet, or one of
      <code class="rounded bg-black/30 px-1 py-0.5">/tournaments</code>,
      <code class="rounded bg-black/30 px-1 py-0.5">/tournaments/:id/categories</code>, or
      <code class="rounded bg-black/30 px-1 py-0.5">/athletes</code> failed.
    </div>

    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div class="flex items-center gap-3 flex-1 min-w-0">
        <div class="relative w-full max-w-sm">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            v-model="search"
            type="text"
            placeholder="Search tournaments..."
            class="w-full rounded-full bg-surface border border-line py-2.5 pl-9 pr-4 text-sm text-white placeholder:text-muted outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/40"
          />
        </div>
      </div>

      <button
        class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition-colors shrink-0"
        @click="showCreateModal = true"
      >
        <Plus class="h-4 w-4" />
        Create Tournament
      </button>
    </div>

    <div>
      <h1 class="text-3xl font-extrabold text-white">Tournaments</h1>
      <p class="text-sm text-muted mt-1">Manage current, upcoming, and archived events.</p>
    </div>

    <div class="flex justify-end gap-3 -mt-10 sm:mt-0">
      <button class="inline-flex items-center gap-2 rounded-lg bg-surface border border-line px-3.5 py-2 text-sm font-medium text-white/90 hover:bg-surface-hover transition-colors">
        <Filter class="h-4 w-4" />
        Filter
      </button>
      <button class="inline-flex items-center gap-2 rounded-lg bg-surface border border-line px-3.5 py-2 text-sm font-medium text-white/90 hover:bg-surface-hover transition-colors">
        <Download class="h-4 w-4" />
        Export
      </button>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <DashboardStatCard label="Total Events" :value="stats.totalEvents" :icon="CalendarPlus" footnote="events tracked" />
      <DashboardStatCard label="Active Now" :value="String(stats.activeNow).padStart(2, '0')" :icon="ShieldCheck" footnote="currently ONGOING" />
      <DashboardStatCard
        label="Registered Athletes"
        :value="stats.registeredAthletes.toLocaleString()"
        :icon="ShieldCheck"
        footnote="across all tournaments"
      />
      <DashboardStatCard label="System Status" value="—" :icon="ShieldCheck" footnote="no backend source yet" />
    </div>

    <div v-if="pending" class="text-sm text-muted">Loading tournaments…</div>
    <TournamentsTable v-else :rows="rows" :search="search" />

    <TournamentsCreateTournamentModal
      v-if="showCreateModal"
      :submitting="creating"
      :submit-error="createError"
      @close="showCreateModal = false"
      @submit="handleCreate"
    />
  </div>
</template>