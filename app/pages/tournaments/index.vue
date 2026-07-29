<script setup lang="ts">
import { Plus, Filter, Download, Search } from 'lucide-vue-next'
import TournamentsTable from '~/components/TournamentsTable.vue'
import CreateTournamentModal from '~/components/CreateTournamentModal.vue'

const {
  rows,
  pending,
  error,
  fetchAll,
  createTournament,
} = useTournamentsData()

const { isStaff } = useAuth()

const search = ref('')
const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref<string | null>(null)

const showFilterMenu = ref(false)
const statusFilter = ref<string | null>(null)

const filteredRows = computed(() => {
  let filtered = rows.value

  if (statusFilter.value) {
    filtered = filtered.filter(
      t => t.displayStatus === statusFilter.value
    )
  }

  if (search.value.trim()) {
    const keyword = search.value.toLowerCase()

    filtered = filtered.filter(t =>
      t.name.toLowerCase().includes(keyword) ||
      t.location.toLowerCase().includes(keyword)
    )
  }

  return filtered
})

onMounted(async () => {
  await fetchAll()
})

async function handleCreateTournament(payload: any) {
  creating.value = true
  createError.value = null

  try {
    await createTournament(payload)
    showCreateModal.value = false
    await fetchAll()
  } catch (err: any) {
    createError.value =
      err?.data?.message ||
      err?.message ||
      'Failed to create tournament'
  } finally {
    creating.value = false
  }
}

function exportToCsv() {
  const data = filteredRows.value
  if (!data.length) return

  const headers = Object.keys(data[0]).filter((k) => typeof data[0][k] !== 'object')
  const csvRows = [
    headers.join(','),
    ...data.map((row: any) =>
      headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ]

  const csvContent = csvRows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `tournaments-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()

  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="space-y-6">

    <!-- Loading -->
    <div
      v-if="pending"
      class="rounded-2xl border border-line bg-surface p-10 text-center text-muted"
    >
      Loading tournaments...
    </div>

    <!-- Error -->
    <div
      v-if="error"
      class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">
          Tournaments
        </h1>

        <p class="mt-1 text-sm text-muted">
          Manage karate tournaments
        </p>
      </div>

      <!-- Staff/Admin only -->
      <ClientOnly>
        <button
          v-if="isStaff"
          class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
          @click="showCreateModal = true"
        >
          <Plus class="h-4 w-4" />
          Create Tournament
        </button>
      </ClientOnly>
    </div>

    <!-- Toolbar (open to any logged-in user) -->
    <div class="flex flex-wrap items-center gap-3">

      <div class="relative flex-1 min-w-[250px] max-w-md">
        <Search
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />

        <input
          v-model="search"
          type="text"
          placeholder="Search tournaments..."
          class="w-full rounded-full border border-line bg-surface py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 text-foreground"
        >
      </div>

      <div class="relative">
        <button
          class="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-foreground transition hover:bg-surface-hover"
          @click="showFilterMenu = !showFilterMenu"
        >
          <Filter class="h-4 w-4" />
          Filter
        </button>

        <div
          v-if="showFilterMenu"
          class="absolute right-0 mt-2 w-48 rounded-xl border border-line bg-surface shadow-2xl py-2 z-50"
        >
          <button
            class="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover"
            @click="statusFilter = null; showFilterMenu = false"
          >
            All
          </button>
          <button
            class="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover"
            @click="statusFilter = 'DRAFT'; showFilterMenu = false"
          >
            Draft
          </button>
          <button
            class="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover"
            @click="statusFilter = 'ONGOING'; showFilterMenu = false"
          >
            Ongoing
          </button>
          <button
            class="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover"
            @click="statusFilter = 'UPCOMING'; showFilterMenu = false"
          >
            Upcoming
          </button>
          <button
            class="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover"
            @click="statusFilter = 'COMPLETED'; showFilterMenu = false"
          >
            Completed
          </button>
          <button
            class="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-surface-hover"
            @click="statusFilter = 'CANCELLED'; showFilterMenu = false"
          >
            Cancelled
          </button>
        </div>
      </div>

      <button
        class="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-foreground transition hover:bg-surface-hover"
        @click="exportToCsv"
      >
        <Download class="h-4 w-4" />
        Export
      </button>

    </div>

    <!-- Table (open to any logged-in user) -->
    <TournamentsTable
      :rows="filteredRows"
      :search="search"
    />

    <!-- Create Tournament Modal -->
    <CreateTournamentModal
      v-if="showCreateModal"
      :submitting="creating"
      :submit-error="createError"
      @close="showCreateModal = false"
      @submit="handleCreateTournament"
    />

  </div>
</template>