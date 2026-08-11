<script setup lang="ts">
import {
  Plus,
  Search,
  Filter,
  Download,
  ChevronDown,
} from 'lucide-vue-next'
import { ref, computed, onMounted } from 'vue'
import PageLoader from '~/components/ui/PageLoader.vue'
const { isAdmin } = useAuth()

import CategoriesTable from '~/components/categories/CategoriesTable.vue'
import CategoryModal from '~/components/categories/CategoryModal.vue'
import DeleteCategoryModal from '~/components/categories/DeleteCategoryModal.vue'
import { useTatami } from '~/composables/useTatami'
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
const { rows: tatamis, fetchAll: fetchTatamis } = useTatami()
// ========== FILTER ==========
const isFilterOpen = ref(false)
const selectedDiscipline = ref('all') // 'all' | 'kata' | 'kumite' | ...

const disciplineOptions = [
  { label: 'All Disciplines', value: 'all' },
  { label: 'Kata', value: 'kata' },
  { label: 'Kumite', value: 'kumite' }
]

const filteredRows = computed(() => {
  let result = rows.value

  // 1. Filter by discipline (Kata / Kumite)
  if (selectedDiscipline.value !== 'all') {
    result = result.filter((c) =>
      c.discipline?.toLowerCase().includes(
        selectedDiscipline.value.toLowerCase()
      )
    )
  }

  // 2. Search
  const q = search.value.toLowerCase().trim()
  if (q) {
    result = result.filter((c) => {
      return (
        c.name?.toLowerCase().includes(q) ||
        c.ageGroup?.toLowerCase().includes(q) ||
        c.gender?.toLowerCase().includes(q) ||
        c.discipline?.toLowerCase().includes(q) ||
        c.tournament?.name?.toLowerCase().includes(q)
      )
    })
  }

  return result
})

function selectDiscipline(option: { label: string; value: string }) {
  selectedDiscipline.value = option.value
  isFilterOpen.value = false
}

// ========== EXPORT ==========
function handleExport() {
  const data = filteredRows.value

  if (!data.length) {
    alert('No categories to export')
    return
  }

  // CSV headers
  const headers = [
    'Name',
    'Age Group',
    'Gender',
    'Discipline',
    'Tournament',
  ]

  const csvRows = [
    headers.join(','),
    ...data.map((c) =>
      [
        `"${c.name || ''}"`,
        `"${c.ageGroup || ''}"`,
        `"${c.gender || ''}"`,
        `"${c.discipline || ''}"`,
        `"${c.tournament?.name || ''}"`,
      ].join(',')
    ),
  ]

  const blob = new Blob([csvRows.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `categories-${selectedDiscipline.value}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// ========== MODALS ==========
const showModal = ref(false)
const showDeleteModal = ref(false)
const selectedCategory = ref<Category | null>(null)

onMounted(async () => {
  await Promise.all([
    refresh(),
    fetchTatamis(),
  ])
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
  <div class="space-y-6 p-6">
    <!-- Header -->
    <div
      class="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-panel p-6 shadow-sm"
    >
      <div>
        <h1 class="text-3xl font-bold text-foreground">Categories</h1>
        <p class="mt-1 text-sm text-muted">Manage tournament categories</p>
      </div>

      <button
        v-if="isAdmin"
        class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-500"
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
    <div class="rounded-2xl border border-line bg-panel p-5 shadow-sm">
      <div class="flex flex-wrap items-center gap-4">
        <!-- Search -->
        <div class="relative min-w-[280px] flex-1">
          <Search
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            v-model="search"
            placeholder="Search category..."
            class="w-full rounded-xl border border-line bg-canvas py-3 pl-10 pr-4 text-sm text-foreground outline-none transition focus:border-blue-500"
          />
        </div>

        <!-- FILTER -->
        <div class="relative">
          <button
            @click="isFilterOpen = !isFilterOpen"
            class="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-foreground transition hover:bg-surface-hover"
          >
            <Filter class="h-4 w-4" />
            {{
              disciplineOptions.find((o) => o.value === selectedDiscipline)
                ?.label || 'Filter'
            }}
            <ChevronDown class="h-4 w-4 opacity-60" />
          </button>

          <!-- Dropdown -->
          <div
            v-if="isFilterOpen"
            class="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
          >
            <button
              v-for="option in disciplineOptions"
              :key="option.value"
              @click="selectDiscipline(option)"
              class="flex w-full items-center px-4 py-2.5 text-left text-sm transition hover:bg-surface-hover"
              :class="{
                'bg-surface-hover font-medium':
                  selectedDiscipline === option.value,
              }"
            >
              {{ option.label }}
            </button>
          </div>
        </div>

        <!-- EXPORT -->
        <button
          @click="handleExport"
          class="flex items-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-foreground transition hover:bg-surface-hover"
        >
          <Download class="h-4 w-4" />
          Export
        </button>
      </div>
    </div>

    <!-- Loading -->
    <PageLoader v-if="pending" text="Loading your matches..." />

    <!-- Empty -->
    <div
      v-else-if="filteredRows.length === 0"
      class="rounded-2xl border border-line bg-surface py-20 text-center"
    >
      <h3 class="text-lg font-semibold text-foreground">No categories found</h3>
      <p class="mt-2 text-muted">
        Click "Add Category" to create one, or change the filter.
      </p>
    </div>

    <!-- Table -->
    <div
      v-else
      class="overflow-hidden rounded-2xl border border-line bg-panel shadow-sm"
    >
      <CategoriesTable
        :rows="filteredRows"
        @edit="openEdit"
        @delete="openDelete"
      />
    </div>

    <!-- Create / Edit -->
    <CategoryModal
      :open="showModal"
      :loading="saving"
      :category="selectedCategory"
      :tournaments="tournaments"
      :tatamis="tatamis"
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