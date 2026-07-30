<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Plus } from 'lucide-vue-next'

import RefereesTable from '~/components/referees/RefereesTable.vue'
import RefereeModal from '~/components/referees/RefereeModal.vue'
import DeleteRefereeModal from '~/components/referees/DeleteRefereeModal.vue'

import { useReferees, type Referee } from '~/composables/useReferees'

const {
  referees,
  pending,
  error,
  fetchReferees,
  createReferee,
  updateReferee,
  deleteReferee,
  uploadPhoto,
} = useReferees()

const search = useState('topbarSearch', () => '')
const statusFilter = ref('')

const showRefereeModal = ref(false)
const showDeleteModal = ref(false)

const modalLoading = ref(false)
const deleteLoading = ref(false)

const selectedReferee = ref<Referee | null>(null)

onMounted(() => {
  fetchReferees()
})

watch(statusFilter, (status) => {
  fetchReferees('', status)
})

function openCreateModal() {
  selectedReferee.value = null
  showRefereeModal.value = true
}

function openEditModal(referee: Referee) {
  selectedReferee.value = referee
  showRefereeModal.value = true
}

function openDeleteModal(referee: Referee) {
  selectedReferee.value = referee
  showDeleteModal.value = true
}

function viewReferee(referee: Referee) {
  navigateTo(`/referees/${referee.id}`)
}

function closeModal() {
  showRefereeModal.value = false
  selectedReferee.value = null
}

function closeDeleteModal() {
  showDeleteModal.value = false
  selectedReferee.value = null
}

async function saveReferee(payload: { referee: any; photoFile?: File }) {
  modalLoading.value = true
  try {
    const { referee, photoFile } = payload

    const dto: any = {
      firstName: referee.firstName,
      lastName: referee.lastName,
      country: referee.country || 'IND',
      license: referee.license || undefined,
      rank: referee.rank || undefined,
      certification: referee.certification || undefined,
      status: referee.status || 'ACTIVE',
      phone: referee.phone || undefined,
      email: referee.email || undefined,
    }

    let saved: any
    if (selectedReferee.value?.id) {
      saved = await updateReferee(selectedReferee.value.id, dto)
    } else {
      saved = await createReferee(dto)
    }

    if (photoFile && saved?.id) {
      await uploadPhoto(saved.id, photoFile)
    }

    closeModal()
  } catch (err: any) {
    console.error(err)
    alert(err?.data?.message || err?.message || 'Failed to save referee')
  } finally {
    modalLoading.value = false
  }
}

async function removeReferee() {
  if (!selectedReferee.value) return
  deleteLoading.value = true
  try {
    await deleteReferee(selectedReferee.value.id)
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
        <h1 class="text-3xl font-bold text-foreground">Referees</h1>
        <p class="mt-1 text-sm text-muted">Manage tournament referees</p>
      </div>

      <button
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
        @click="openCreateModal"
      >
        <Plus class="h-4 w-4" />
        Register Referee
      </button>
    </div>

    <div class="flex items-center gap-3">
      <select v-model="statusFilter" class="rounded-xl border border-line bg-surface px-4 py-2.5">
        <option value="">All Statuses</option>
        <option value="ACTIVE">Active</option>
        <option value="INACTIVE">Inactive</option>
        <option value="SUSPENDED">Suspended</option>
      </select>
    </div>

    <div
      v-if="error"
      class="rounded-xl border border-red-500 bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </div>

    <RefereesTable
      :referees="referees"
      :loading="pending"
      :search="search"
      @view="viewReferee"
      @edit="openEditModal"
      @delete="openDeleteModal"
    />

    <RefereeModal
      :open="showRefereeModal"
      :loading="modalLoading"
      :referee="selectedReferee"
      @close="closeModal"
      @save="saveReferee"
    />

    <DeleteRefereeModal
      :open="showDeleteModal"
      :loading="deleteLoading"
      :referee-name="`${selectedReferee?.firstName || ''} ${selectedReferee?.lastName || ''}`.trim()"
      @close="closeDeleteModal"
      @delete="removeReferee"
    />
  </div>
</template>