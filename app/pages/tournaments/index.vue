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

const search = ref('')
const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref<string |null>(null)

onMounted(async () => {
  await fetchAll()
})

async function handleCreate(payload: any) {
  creating.value = true
  createError.value = null

  try {
    await createTournament(payload)
    showCreateModal.value = false
  } catch (err: any) {
    createError.value =
      err?.data?.message ||
      err?.message ||
      'Failed to create tournament'
  } finally {
    creating.value = false
  }
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
        <h1 class="text-3xl font-bold text-white">
          Tournaments
        </h1>

        <p class="mt-1 text-sm text-muted">
          Manage karate tournaments
        </p>
      </div>

      <button
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
        @click="showCreateModal = true"
      >
        <Plus class="h-4 w-4" />
        Create Tournament
      </button>
    </div>

    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3">

      <div class="relative flex-1 min-w-[250px] max-w-md">
        <Search
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />

        <input
          v-model="search"
          type="text"
          placeholder="Search tournaments..."
          class="w-full rounded-full border border-line bg-surface py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
        >
      </div>

      <button
        class="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-zinc-800"
      >
        <Filter class="h-4 w-4" />
        Filter
      </button>

      <button
        class="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 transition hover:bg-zinc-800"
      >
        <Download class="h-4 w-4" />
        Export
      </button>

    </div>

    <!-- Table -->
    <TournamentsTable
      :rows="rows"
      :search="search"
    />

    <!-- Create Tournament Modal -->
    <CreateTournamentModal
      v-if="showCreateModal"
      :submitting="creating"
      :submit-error="createError"
      @close="showCreateModal = false"
      @submit="handleCreate"
    />

  </div>
</template>