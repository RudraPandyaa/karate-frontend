<script setup lang="ts">
import type { Tatami } from '~/composables/useTatami'
import TatamiCard from '~/components/tatami/TatamiCard.vue'
import TatamiFormModal from '~/components/tatami/TatamiFormModal.vue'
import PageLoader from '~/components/ui/PageLoader.vue'

const { isAdmin } = useAuth()
const route = useRoute()

const tournamentId = route.params.tournamentId as string

const {
  rows: tatamis,
  pending,
  saving,
  error,
  fetchTatami,
  createTatami,
  updateTatami,
  deleteTatami,
  autoAssign,
} = useTatami()

const showForm = ref(false)
const editingTatami = ref<Tatami | null>(null)

onMounted(async () => {
  await fetchTatami(tournamentId)
})

function openCreate() {
  if (!isAdmin.value) return
  editingTatami.value = null
  showForm.value = true
}

function openEdit(tatami: Tatami) {
  if (!isAdmin.value) return
  editingTatami.value = tatami
  showForm.value = true
}

async function handleDelete(id: string) {
  if (!isAdmin.value) return
  if (!confirm('Delete this tatami?')) return
  await deleteTatami(id)
  await fetchTatami(tournamentId)
}

async function handleAutoAssign() {
  if (!isAdmin.value) return
  await autoAssign(tournamentId)
  await fetchTatami(tournamentId)
}

async function handleSubmit(payload: { number: number; name: string }) {
  try {
    if (editingTatami.value) {
      await updateTatami(editingTatami.value.id, payload)
    } else {
      await createTatami({
        tournamentId,
        ...payload,
      })
    }
    showForm.value = false
    editingTatami.value = null
    await fetchTatami(tournamentId)
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div class="p-6">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-3xl font-bold text-foreground">
        Tatami Management
      </h1>

      <div
        v-if="isAdmin"
        class="flex gap-3"
      >
        <button
          type="button"
          class="rounded-xl bg-blue-600 px-5 py-3 text-white"
          @click="openCreate"
        >
          Add Tatami
        </button>
        <button
          type="button"
          class="rounded-xl bg-green-600 px-5 py-3 text-white"
          @click="handleAutoAssign"
        >
          Auto Assign
        </button>
      </div>
    </div>

    <PageLoader
      v-if="pending && tatamis.length === 0"
      text="Loading tatamis..."
    />

    <div
      v-else-if="error"
      class="text-red-400"
    >
      {{ error }}
    </div>

    <div
      v-else-if="tatamis.length === 0"
      class="text-muted"
    >
      No Tatamis Found
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
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
      v-if="showForm && isAdmin"
      :tournament-id="tournamentId"
      :tatami="editingTatami"
      :saving="saving"
      :error="error"
      @submit="handleSubmit"
      @close="showForm = false"
    />
  </div>
</template>