<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { Athlete } from '~/composables/useAthletes'
import { getAthleteIdNumber } from '~/composables/useAthletes'
import CountryFlag from 'vue-country-flag-next'
import { COUNTRY_CODE_MAP } from '~/utils/countries'
import PageLoader from '~/components/ui/PageLoader.vue'

const props = defineProps<{
  athletes: Athlete[]
  loading?: boolean
  search?: string
  // Full category list (not just what each athlete is enrolled in) —
  // used to populate the category filter dropdown.
  canManage?: boolean
  categories?: { id: string; name: string }[]
}>()

const emit = defineEmits<{
  (e: 'view', athlete: Athlete): void
  (e: 'edit', athlete: Athlete): void
  (e: 'delete', athlete: Athlete): void
}>()

function getDisplayName(athlete: Athlete) {
  return (
    athlete.fullName ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    '—'
  )
}

/* -----------------------------
 * Filters
 * ----------------------------- */

const selectedCountry = ref('')
const selectedCategoryId = ref('')
const selectedGender = ref('')

const availableCountries = computed(() => {
  const set = new Set(
    props.athletes.map((a) => a.country).filter((c): c is string => !!c)
  )
  return Array.from(set).sort()
})

const availableCategories = computed(() => props.categories || [])

function clearFilters() {
  selectedCountry.value = ''
  selectedCategoryId.value = ''
  selectedGender.value = ''
}

const hasActiveFilters = computed(
  () => !!(selectedCountry.value || selectedCategoryId.value || selectedGender.value)
)

/* -----------------------------
 * Search + Filter
 * ----------------------------- */

const filtered = computed(() => {
  let list = props.athletes

  const q = (props.search || '').trim().toLowerCase()
  if (q) {
    list = list.filter((a) => {
      const name = getDisplayName(a).toLowerCase()
      const idNumber = getAthleteIdNumber(a).toLowerCase()

      return (
        name.includes(q) ||
        idNumber.includes(q) ||
        a.state?.toLowerCase().includes(q) ||
        a.country?.toLowerCase().includes(q) ||
        a.phone?.toLowerCase().includes(q)
      )
    })
  }

  if (selectedCountry.value) {
    list = list.filter((a) => a.country === selectedCountry.value)
  }

  if (selectedGender.value) {
    list = list.filter((a) => a.gender === selectedGender.value)
  }

  if (selectedCategoryId.value) {
    list = list.filter((a) =>
      (a.categories || []).some((c) => c.id === selectedCategoryId.value)
    )
  }

  return list
})

/* -----------------------------
 * Pagination
 * ----------------------------- */

const currentPage = ref(1)
const pageSize = ref(10)
const pageSizeOptions = [10, 25, 50]

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize.value))
)

const paginated = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

const rangeStart = computed(() =>
  filtered.value.length === 0 ? 0 : (currentPage.value - 1) * pageSize.value + 1
)
const rangeEnd = computed(() =>
  Math.min(currentPage.value * pageSize.value, filtered.value.length)
)

// Reset to page 1 whenever the result set changes shape (search, filters,
// or page size), and clamp if the current page no longer exists.
watch([selectedCountry, selectedGender, selectedCategoryId, () => props.search, pageSize], () => {
  currentPage.value = 1
})
watch(totalPages, (tp) => {
  if (currentPage.value > tp) currentPage.value = tp
})

function goToPage(p: number) {
  currentPage.value = Math.min(Math.max(1, p), totalPages.value)
}
</script>

<template>
  <div class="space-y-4">
    <!-- Filter bar -->
    <div class="flex flex-wrap items-end gap-3">
      <div>
        <label class="mb-1 block text-xs font-medium text-muted">Country</label>
        <select v-model="selectedCountry" class="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground">
          <option value="">All countries</option>
          <option v-for="c in availableCountries" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-muted">Category</label>
        <select v-model="selectedCategoryId" class="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground">
          <option value="">All categories</option>
          <option v-for="c in availableCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div>
        <label class="mb-1 block text-xs font-medium text-muted">Gender</label>
        <select v-model="selectedGender" class="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground">
          <option value="">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="MIXED">Mixed</option>
        </select>
      </div>

      <button
        v-if="hasActiveFilters"
        class="rounded-xl border border-line px-3 py-2 text-sm text-muted hover:bg-surface-hover hover:text-foreground transition"
        @click="clearFilters"
      >
        Clear filters
      </button>

      <div class="ml-auto">
        <label class="mb-1 block text-xs font-medium text-muted text-right">Per page</label>
        <select v-model.number="pageSize" class="rounded-xl border border-line bg-surface px-3 py-2 text-sm text-foreground">
          <option v-for="n in pageSizeOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </div>
    </div>

    <div class="bg-surface border border-line rounded-2xl overflow-hidden">
      <!-- Loading -->
      <PageLoader v-if="loading" text="Loading your athletes..." />

      <!-- Empty -->
      <div v-else-if="filtered.length === 0" class="py-16 text-center text-muted">
        No athletes found.
      </div>

      <!-- Table -->
      <table v-else class="w-full">
        <thead class="bg-canvas/60">
          <tr>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              ID Number
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              Athlete
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              Country
            </th>
            <th class="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted">
              Categories
            </th>
            <th class="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-muted">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="athlete in paginated"
            :key="athlete.id"
            class="border-t border-line hover:bg-surface-hover transition"
          >
          <!-- ID Number -->
          <td class="px-6 py-4">
            <span class="font-mono text-sm font-medium text-foreground">
              {{ getAthleteIdNumber(athlete) }}
            </span>
          </td>
            <!-- Athlete (photo + name + state) -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl overflow-hidden bg-canvas border border-line shrink-0">
                  <img
                    v-if="athlete.photoUrl"
                    :src="athlete.photoUrl"
                    :alt="getDisplayName(athlete)"
                    class="w-full h-full object-cover"
                  />
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center text-xs font-semibold text-muted"
                  >
                    {{ getDisplayName(athlete).charAt(0).toUpperCase() }}
                  </div>
                </div>

                <div class="min-w-0">
                  <p class="font-medium text-foreground truncate">
                    {{ getDisplayName(athlete) }}
                  </p>
                  <p class="text-sm text-muted truncate">
                    {{ athlete.state || '—' }}
                  </p>
                </div>
              </div>
            </td>

            <!-- Country -->
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <CountryFlag
                  v-if="COUNTRY_CODE_MAP[athlete.country]"
                  :country="COUNTRY_CODE_MAP[athlete.country]"
                  size="small"
                />
                <span class="text-sm text-muted">
                  {{ athlete.country || '—' }}
                </span>
              </div>
            </td>

            <!-- Categories (names, not just a count) -->
            <td class="px-6 py-4 text-sm text-muted">
              <div v-if="athlete.categories?.length" class="flex flex-wrap gap-1 max-w-xs">
                <span
                  v-for="c in athlete.categories"
                  :key="c.id"
                  class="px-2 py-0.5 rounded-full bg-canvas border border-line text-xs text-foreground"
                >
                  {{ c.name }}
                </span>
              </div>
              <span v-else>No categories</span>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4 text-right space-x-3">
              <button
                class="text-blue-400 hover:text-blue-300 text-sm"
                @click="emit('view', athlete)"
              >
                View
              </button>
              <button
                v-if="canManage"
                class="text-muted hover:text-foreground text-sm"
                @click="emit('edit', athlete)"
              >
                Edit
              </button>
              <button
               v-if="canManage"
                 class="text-red-400 hover:text-red-300 text-sm"
                 @click="emit('delete', athlete)"
               >
                 Delete
               </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div
        v-if="!loading && filtered.length > 0"
        class="flex items-center justify-between border-t border-line px-6 py-4"
      >
        <p class="text-sm text-muted">
          Showing {{ rangeStart }}–{{ rangeEnd }} of {{ filtered.length }}
        </p>

        <div class="flex items-center gap-2">
          <button
            class="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Prev
          </button>

          <span class="text-sm text-muted px-2">
            Page {{ currentPage }} of {{ totalPages }}
          </span>

          <button
            class="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>