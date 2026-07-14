<script setup lang="ts">
import {
  Plus,
  Search,
  Filter,
  Download,
} from 'lucide-vue-next'

import CategoriesTable from '~/components/categories/CategoriesTable.vue'
import CategoryModal from '~/components/categories/CategoryModal.vue'
import DeleteCategoryModal from '~/components/categories/DeleteCategoryModal.vue'

import {
  useCategories,
  type Category,
  type CategoryPayload,
} from '~/composables/useCategories'

const {
  rows,
  tournaments,
 pending,
  saving,
  error,
  refresh,
  createCategory,
  updateCategory,
  deleteCategory,
} = useCategories()

const search = useState('topbarSearch', () => '')

const showModal = ref(false)
const showDeleteModal = ref(false)

const selectedCategory = ref<Category | null>(null)

const filteredRows = computed(() => {
  const q = search.value.toLowerCase().trim()

  if (!q) return rows.value

  return rows.value.filter((c) => {
    return (
      c.name.toLowerCase().includes(q) ||
      c.ageGroup.toLowerCase().includes(q) ||
      c.gender.toLowerCase().includes(q) ||
      c.discipline.toLowerCase().includes(q) ||
      c.tournament?.name?.toLowerCase().includes(q)
    )
  })
})

onMounted(async () => {
  await refresh()
})

function openCreate() {
  selectedCategory.value = null
  showModal.value = true
}

function openEdit(category: Category) {
  selectedCategory.value = category
  showModal.value = true
}

function openDelete(category: Category) {
  selectedCategory.value = category
  showDeleteModal.value = true
}

async function handleSubmit(payload: CategoryPayload) {
  try {
    if (selectedCategory.value) {
      await updateCategory(selectedCategory.value.id, payload)
    } else {
      await createCategory(payload)
    }

    showModal.value = false
  } catch (err) {
    console.error(err)
  }
}

async function handleDelete() {
  if (!selectedCategory.value) return

  try {
    await deleteCategory(selectedCategory.value.id)

    showDeleteModal.value = false
    selectedCategory.value = null
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div class="space-y-6">

    <!-- Header -->

    <div class="flex items-center justify-between">

      <div>
        <h1 class="text-3xl font-bold text-white">
          Categories
        </h1>

        <p class="mt-1 text-sm text-muted">
          Manage tournament categories
        </p>
      </div>

      <button
        class="btn btn-primary flex items-center gap-2"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />

        Add Category
      </button>

    </div>

    <!-- Error -->

    <div
      v-if="error"
      class="rounded-xl border border-red-500 bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </div>

    <!-- Toolbar -->

    <div class="flex flex-wrap gap-4">

      <div class="relative flex-1 min-w-[280px]">

        <Search
          class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        />

        <input
          v-model="search"
          placeholder="Search category..."
          class="w-full rounded-full border border-line bg-surface py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-600"
        />

      </div>

      <button
        class="btn btn-secondary flex items-center gap-2"
      >
        <Filter class="h-4 w-4" />

        Filter
      </button>

      <button
        class="btn btn-secondary flex items-center gap-2"
      >
        <Download class="h-4 w-4" />

        Export
      </button>

    </div>

    <!-- Loading -->

    <div
      v-if="pending"
      class="rounded-2xl border border-line bg-surface py-16 text-center text-muted"
    >
      Loading categories...
    </div>

    <!-- Empty -->

    <div
      v-else-if="filteredRows.length === 0"
      class="rounded-2xl border border-line bg-surface py-20 text-center"
    >
      <h3 class="text-lg font-semibold">
        No categories found
      </h3>

      <p class="mt-2 text-muted">
        Click "Add Category" to create one.
      </p>
    </div>

    <!-- Table -->

    <CategoriesTable
      v-else
      :rows="filteredRows"
      @edit="openEdit"
      @delete="openDelete"
    />

    <!-- Create / Edit -->

    <CategoryModal
      :open="showModal"
      :loading="saving"
      :category="selectedCategory"
      :tournaments="tournaments"
      @close="showModal = false"
      @submit="handleSubmit"
    />

    <!-- Delete -->

    <DeleteCategoryModal
      :open="showDeleteModal"
      :loading="saving"
      :category="selectedCategory"
      @close="showDeleteModal = false"
      @confirm="handleDelete"
    />

  </div>
</template>