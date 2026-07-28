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
  uploadPhoto,
  enrollAthlete,
} = useAthletes()

const {
  rows: categories,
  fetchCategories,
} = useCategories()

const search = useState('topbarSearch', () => '')

const showAthleteModal = ref(false)
const showDeleteModal = ref(false)

const modalLoading = ref(false)
const deleteLoading = ref(false)

const selectedAthlete = ref<Athlete | null>(null)

onMounted(async () => {
  await Promise.all([
    fetchAthletes(),
    fetchCategories(),
  ])
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

async function saveAthlete(payload: {
  athlete: any
  photoFile?: File
}) {
  modalLoading.value = true

  try {
    const {
      athlete,
      photoFile,
    } = payload

    let savedAthlete: any

    if (selectedAthlete.value?.id) {
      // Update existing athlete
      savedAthlete = await updateAthlete(
        selectedAthlete.value.id,
        {
          name: athlete.name,
          state: athlete.state,
          country: athlete.country,
        }
      )
    } else {
      // Create athlete
      savedAthlete = await createAthlete({
        name: athlete.name,
        state: athlete.state,
        country: athlete.country,
      })
    }

    // Upload photo
    if (photoFile && savedAthlete?.id) {
      await uploadPhoto(
        savedAthlete.id,
        photoFile
      )
    }

    // Enroll athlete into category
    if (
      athlete.categoryId &&
      savedAthlete?.id
    ) {
      await enrollAthlete(
        savedAthlete.id,
        {
          categoryId: athlete.categoryId,
        }
      )
    }

    await fetchAthletes()

    closeModal()

  } catch (err: any) {
    console.error(err)

    alert(
      err?.data?.message ||
      err.message ||
      'Failed to save athlete'
    )
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
        <h1 class="text-3xl font-bold text-foreground">Athletes</h1>
        <p class="mt-1 text-sm text-muted">Manage tournament athletes</p>
      </div>

      <button
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      :categories="categories"
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