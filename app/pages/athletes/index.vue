<script setup lang="ts">
import { Plus } from 'lucide-vue-next'

import AthletesTable from '~/components/athletes/AthletesTable.vue'
import AthleteModal from '~/components/athletes/AthleteModal.vue'
import DeleteAthleteModal from '~/components/athletes/DeleteAthleteModal.vue'

import { useAthletes, type Athlete, type CreateAthleteDto } from '~/composables/useAthletes'

const {
  athletes,
  pending,
  error,
  fetchAthletes,
  createAthlete,
  updateAthlete,
  deleteAthlete,
} = useAthletes()

const search = useState('topbarSearch', () => '')

const showAthleteModal = ref(false)
const showDeleteModal = ref(false)

const modalLoading = ref(false)
const deleteLoading = ref(false)

const selectedAthlete = ref<Athlete | null>(null)

onMounted(async () => {
  await fetchAthletes()
})

function openCreateModal() {
  selectedAthlete.value = null
  showAthleteModal.value = true
}

function openEditModal(athlete: Athlete) {
  selectedAthlete.value = athlete
  showAthleteModal.value = true
}

function openDeleteModal(athlete: Athlete) {
  selectedAthlete.value = athlete
  showDeleteModal.value = true
}

function viewAthlete(athlete: Athlete) {
  navigateTo(`/athletes/${athlete.id}`)
}

function closeModal() {
  showAthleteModal.value = false
  selectedAthlete.value = null
}

function closeDeleteModal() {
  showDeleteModal.value = false
  selectedAthlete.value = null
}

async function saveAthlete(form: Athlete) {
  modalLoading.value = true

  try {
    const { id, ...payload } = form as CreateAthleteDto & { id?: string }

    if (selectedAthlete.value) {
      await updateAthlete(selectedAthlete.value.id, payload)
    } else {
      await createAthlete(payload)
    }

    closeModal()
  } catch (err) {
    console.error(err)
  } finally {
    modalLoading.value = false
  }
}

async function removeAthlete() {
  if (!selectedAthlete.value) return

  deleteLoading.value = true

  try {
    await deleteAthlete(selectedAthlete.value.id)
    closeDeleteModal()
  } catch (err) {
    console.error(err)
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <div class="space-y-6">

    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-white">Athletes</h1>
        <p class="mt-1 text-sm text-muted">Manage tournament athletes</p>
      </div>

      <button
        class="btn btn-primary flex items-center gap-2"
        @click="openCreateModal"
      >
        <Plus class="h-4 w-4" />
        Register Athlete
      </button>
    </div>

    <div
      v-if="error"
      class="rounded-xl border border-red-500 bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </div>

    <AthletesTable
      :athletes="athletes"
      :loading="pending"
      :search="search"
      @view="viewAthlete"
      @edit="openEditModal"
      @delete="openDeleteModal"
    />

    <AthleteModal
      :open="showAthleteModal"
      :loading="modalLoading"
      :athlete="selectedAthlete"
      @close="closeModal"
      @save="saveAthlete"
    />

    <DeleteAthleteModal
      :open="showDeleteModal"
      :loading="deleteLoading"
      :athlete-name="selectedAthlete?.name"
      @close="closeDeleteModal"
      @delete="removeAthlete"
    />

  </div>
</template>