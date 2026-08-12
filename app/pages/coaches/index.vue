<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus } from 'lucide-vue-next'

import CoachesTable from '~/components/coaches/CoachesTable.vue'
import CoachesModal from '~/components/coaches/CoachesModal.vue'
import DeleteCoachModal from '~/components/coaches/DeleteCoachModal.vue'

import { useCoaches, type Coach } from '~/composables/useCoaches'
definePageMeta({
  layout: 'default',
  middleware: 'admin',
})
const { isAdmin } = useAuth()

const {
  coaches,
  pending,
  error,
  fetchCoaches,
  createCoach,
  updateCoach,
  deleteCoach,
} = useCoaches()

// Swap for your actual dojos composable if the name differs
const { rows: dojos, fetchDojos } = useDojos()

const search = useState('topbarSearch', () => '')

const showCoachModal = ref(false)
const showDeleteModal = ref(false)

const modalLoading = ref(false)
const deleteLoading = ref(false)

const selectedCoach = ref<Coach | null>(null)

onMounted(async () => {
  await Promise.all([
    fetchCoaches(),
    fetchDojos(),
  ])
})

function openCreateModal() {
  selectedCoach.value = null
  showCoachModal.value = true
}

function openEditModal(coach: Coach) {
  selectedCoach.value = coach
  showCoachModal.value = true
}

function openDeleteModal(coach: Coach) {
  selectedCoach.value = coach
  showDeleteModal.value = true
}

function viewCoach(coach: Coach) {
  navigateTo(`/coaches/${coach.id}`)
}

function closeModal() {
  showCoachModal.value = false
  selectedCoach.value = null
}

function closeDeleteModal() {
  showDeleteModal.value = false
  selectedCoach.value = null
}

async function saveCoach(payload: { coach: any }) {
  modalLoading.value = true
  try {
    const { coach } = payload

    const dto = {
      firstName: coach.firstName,
      lastName: coach.lastName,
      phone: coach.phone || undefined,
      email: coach.email || undefined,
      country: coach.country || 'IND',
      dojoId: coach.dojoId || undefined,
    }

    if (selectedCoach.value?.id) {
      await updateCoach(selectedCoach.value.id, dto)
    } else {
      await createCoach(dto)
    }

    await fetchCoaches()
    closeModal()
  } catch (err: any) {
    console.error(err)
    alert(err?.data?.message || err?.message || 'Failed to save coach')
  } finally {
    modalLoading.value = false
  }
}

async function removeCoach() {
  if (!selectedCoach.value) return
  deleteLoading.value = true
  try {
    await deleteCoach(selectedCoach.value.id)
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
        <h1 class="text-3xl font-bold text-foreground">Coaches</h1>
        <p class="mt-1 text-sm text-muted">Manage tournament coaches</p>
      </div>

      <button
        v-if="isAdmin"
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        @click="openCreateModal"
      >
        <Plus class="h-4 w-4" />
        Register Coach
      </button>
    </div>

    <div
      v-if="error"
      class="rounded-xl border border-red-500 bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </div>

    <CoachesTable
      :coaches="coaches"
      :loading="pending"
      :search="search"
      @view="viewCoach"
      @edit="openEditModal"
      @delete="openDeleteModal"
    />

    <CoachesModal
      :open="showCoachModal"
      :loading="modalLoading"
      :coach="selectedCoach"
      :dojos="dojos"
      @close="closeModal"
      @save="saveCoach"
    />

    <DeleteCoachModal
      :open="showDeleteModal"
      :loading="deleteLoading"
      :coach-name="`${selectedCoach?.firstName || ''} ${selectedCoach?.lastName || ''}`.trim()"
      @close="closeDeleteModal"
      @delete="removeCoach"
    />
  </div>
</template>