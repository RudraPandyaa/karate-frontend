<script setup lang="ts">
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'default',
  middleware: 'admin',
})

const { isAdmin } = useAuth()
const {
  rows,
  pending,
  saving,
  error,
  fetchAll,
  create,
  update,
  remove,
} = useOrganizations()

const showForm = ref(false)
const editingId = ref<string | null>(null)
const name = ref('')
const formError = ref('')

onMounted(fetchAll)

function openCreate() {
  editingId.value = null
  name.value = ''
  formError.value = ''
  showForm.value = true
}

function openEdit(org: { id: string; name: string }) {
  editingId.value = org.id
  name.value = org.name
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  name.value = ''
  formError.value = ''
}

async function submit() {
  formError.value = ''
  if (!name.value.trim()) {
    formError.value = 'Organization name is required'
    return
  }

  try {
    if (editingId.value) {
      await update(editingId.value, name.value.trim())
    } else {
      await create(name.value.trim())
    }
    closeForm()
  } catch (err: any) {
    formError.value =
      err?.data?.message || err?.message || 'Failed to save organization'
  }
}

async function handleDelete(org: { id: string; name: string }) {
  if (!confirm(`Delete organization "${org.name}"?`)) return
  try {
    await remove(org.id)
  } catch (err: any) {
    alert(err?.data?.message || 'Failed to delete. It may still have tournaments.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Organizations</h1>
        <p class="mt-1 text-sm text-muted">
          Federations, associations or clubs that host tournaments
        </p>
      </div>

      <button
        v-if="isAdmin"
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        Add Organization
      </button>
    </div>

    <PageLoader v-if="pending" text="Loading organizations..." />

    <div
      v-else-if="error"
      class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </div>

    <div
      v-else-if="rows.length === 0"
      class="rounded-2xl border border-dashed border-line bg-surface py-16 text-center"
    >
      <p class="text-lg font-medium text-foreground">No organizations yet</p>
      <p class="mt-2 text-sm text-muted">
        Create one before adding tournaments.
      </p>
      <button
        v-if="isAdmin"
        type="button"
        class="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        @click="openCreate"
      >
        Add Organization
      </button>
    </div>

    <div
      v-else
      class="overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <table class="w-full">
        <thead class="border-b border-line bg-canvas/50">
          <tr>
            <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">
              Name
            </th>
            <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">
              Tournaments
            </th>
            <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-muted">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="org in rows"
            :key="org.id"
            class="border-t border-line hover:bg-surface-hover"
          >
            <td class="px-5 py-4 font-medium text-foreground">
              {{ org.name }}
            </td>
            <td class="px-5 py-4 text-sm text-muted">
              {{ org._count?.tournaments ?? 0 }}
            </td>
            <td class="px-5 py-4">
              <div class="flex justify-end gap-2">
                <button
                  type="button"
                  class="rounded-lg border border-line p-2 text-muted hover:bg-canvas hover:text-foreground"
                  @click="openEdit(org)"
                >
                  <Pencil class="h-4 w-4" />
                </button>
                <button
                  v-if="isAdmin"
                  type="button"
                  class="rounded-lg border border-line p-2 text-red-400 hover:bg-red-500/10"
                  @click="handleDelete(org)"
                >
                  <Trash2 class="h-4 w-4" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div
        v-if="showForm"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
        @click.self="closeForm"
      >
        <div class="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-2xl">
          <h2 class="text-xl font-bold text-foreground">
            {{ editingId ? 'Edit Organization' : 'Add Organization' }}
          </h2>

          <p
            v-if="formError"
            class="mt-3 text-sm text-red-400"
          >
            {{ formError }}
          </p>

          <label class="mt-5 mb-2 block text-sm text-muted">Name</label>
          <input
            v-model="name"
            type="text"
            placeholder="e.g. India Karate Federation"
            class="w-full rounded-xl border border-line bg-surface px-4 py-3 text-foreground outline-none focus:border-blue-500"
            @keyup.enter="submit"
          >

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="rounded-xl border border-line px-4 py-2 text-sm text-foreground hover:bg-surface"
              @click="closeForm"
            >
              Cancel
            </button>
            <button
              type="button"
              :disabled="saving"
              class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              @click="submit"
            >
              {{ saving ? 'Saving...' : editingId ? 'Save' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>