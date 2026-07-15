<script setup lang="ts">
import type { Tatami } from '~/composables/useTatami'

import TatamiCard from '~/components/tatami/TatamiCard.vue'
import TatamiFormModal from '~/components/tatami/TatamiFormModal.vue'

const route = useRoute()
const tournamentId = route.params.tournamentId as string

const {
  rows: tatamis,
  pending,
  error,
  fetchTatami,
  deleteTatami,
  autoAssign,
} = useTatami()

const showForm = ref(false)
const editingTatami = ref<Tatami | null>(null)

onMounted(async () => {
  await fetchTatami(tournamentId)
})

function openCreate() {
  editingTatami.value = null
  showForm.value = true
}

function openEdit(tatami: Tatami) {
  editingTatami.value = tatami
  showForm.value = true
}

async function handleSaved() {
  showForm.value = false
  editingTatami.value = null
  await fetchTatami(tournamentId)
}

async function handleDelete(id: string) {
  if (!confirm('Delete this tatami?')) return

  await deleteTatami(id)
}

async function handleAutoAssign() {
  await autoAssign(tournamentId)
  await fetchTatami(tournamentId)
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-foreground">
        Tatami Management
      </h1>

      <div class="flex gap-3">
        <button
          class="bg-blue-600 px-5 py-3 rounded-xl text-white"
          @click="openCreate"
        >
          Add Tatami
        </button>

        <button
          class="bg-green-600 px-5 py-3 rounded-xl text-white"
          @click="handleAutoAssign"
        >
          Auto Assign
        </button>
      </div>
    </div>

    <div v-if="pending" class="text-muted">
      Loading...
    </div>

    <div v-else-if="error" class="text-red-400">
      {{ error }}
    </div>

    <div v-else-if="tatamis.length === 0" class="text-muted">
      No Tatamis Found
    </div>

    <div
      v-else
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <TatamiCard
        v-for="tatami in tatamis"
        :key="tatami.id"
        :tatami="tatami"
        @edit="openEdit"
        @delete="handleDelete"
      />
    </div>

    <TatamiFormModal
      v-if="showForm"
      :tournament-id="tournamentId"
      :tatami="editingTatami"
      @saved="handleSaved"
      @close="showForm = false"
    />
  </div>
</template>