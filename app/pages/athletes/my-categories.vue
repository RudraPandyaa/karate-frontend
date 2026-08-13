<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import { Plus, Loader2 } from 'lucide-vue-next'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'
import { useAthletes } from '~/composables/useAthletes'
import { useCategories } from '~/composables/useCategories'
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'athlete',
  middleware: ['athlete'],
})

const {
  dashboard,
  pending,
  error,
  fetchDashboard,
} = useAthleteDashboard()

const { enrollAthlete, saving } = useAthletes()

const {
  rows: allCategories,
  tournaments,
  fetchCategories,
  fetchTournaments,
} = useCategories()

const selectedTournamentId = ref('')
const selectedCategoryId = ref('')
const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)

const athleteId = computed(() => dashboard.value?.athlete?.id || null)

const athleteGender = computed(
  () => dashboard.value?.athlete?.gender || null,
)

const enrolledCategoryIds = computed(() => {
  const list = dashboard.value?.categories ?? []
  return new Set(list.map((c: any) => c.id))
})

const availableCategories = computed(() => {
  if (!selectedTournamentId.value) return []

  return allCategories.value.filter((c) => {
    if (c.tournamentId !== selectedTournamentId.value) return false
    if (enrolledCategoryIds.value.has(c.id)) return false
    if (
      athleteGender.value &&
      c.gender !== 'MIXED' &&
      c.gender !== athleteGender.value
    ) {
      return false
    }
    return true
  })
})

onMounted(async () => {
  await Promise.all([
    fetchDashboard(),
    fetchCategories(),
    fetchTournaments(),
  ])
})

function formatDiscipline(discipline?: string) {
  if (!discipline) return '—'
  return discipline
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatGender(gender?: string) {
  if (!gender) return '—'
  return gender.charAt(0) + gender.slice(1).toLowerCase()
}

function weightLabel(category: any) {
  if (
    category.discipline === 'KATA' ||
    category.discipline === 'TEAM_KATA'
  ) {
    return '—'
  }
  if (category.weightMin == null && category.weightMax == null) return 'Open'
  if (category.weightMin == null) return `-${category.weightMax} kg`
  if (category.weightMax == null) return `+${category.weightMin} kg`
  return `${category.weightMin}–${category.weightMax} kg`
}

async function handleEnroll() {
  formError.value = null
  formSuccess.value = null

  if (!athleteId.value) {
    formError.value = 'Athlete profile not found.'
    return
  }
  if (!selectedCategoryId.value) {
    formError.value = 'Please select a category.'
    return
  }

  try {
    await enrollAthlete(athleteId.value, {
      categoryId: selectedCategoryId.value,
    })
    formSuccess.value = 'Successfully enrolled in category.'
    selectedCategoryId.value = ''
    selectedTournamentId.value = ''
    await fetchDashboard()
  } catch (err: any) {
    const status = err?.statusCode || err?.status
    const msg =
      err?.data?.message ||
      err?.message ||
      'Failed to enroll'
    if (status === 409 || String(msg).toLowerCase().includes('already')) {
      formError.value = 'Already enrolled in this category.'
    } else {
      formError.value = msg
    }
  }
}
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-8 px-4 py-6 lg:px-8 lg:py-8">
    <div>
      <h1 class="text-3xl font-bold text-foreground">My Categories</h1>
      <p class="mt-1 text-sm text-muted">
        View your enrollments or register for a tournament category
      </p>
    </div>

    <PageLoader v-if="pending" text="Loading your categories..." />

    <div
      v-else-if="error"
      class="rounded-3xl border border-red-500/40 bg-red-500/10 p-5 text-red-300"
    >
      {{ error }}
    </div>

    <template v-else>
      <!-- Register for category -->
      <section class="rounded-3xl border border-line bg-surface p-6 space-y-4">
        <div class="flex items-center gap-2">
          <Plus class="h-5 w-5 text-blue-400" />
          <h2 class="text-lg font-semibold text-foreground">
            Register for a category
          </h2>
        </div>

        <p class="text-sm text-muted">
          Choose an open tournament and a category that matches your profile.
        </p>

        <div
          v-if="formError"
          class="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {{ formError }}
        </div>
        <div
          v-if="formSuccess"
          class="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        >
          {{ formSuccess }}
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-muted">
              Tournament
            </label>
            <select
              v-model="selectedTournamentId"
              class="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-foreground outline-none focus:border-blue-600"
              @change="selectedCategoryId = ''"
            >
              <option value="">Select tournament</option>
              <option
                v-for="t in tournaments"
                :key="t.id"
                :value="t.id"
              >
                {{ t.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-muted">
              Category
            </label>
            <select
              v-model="selectedCategoryId"
              :disabled="!selectedTournamentId"
              class="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-foreground outline-none focus:border-blue-600 disabled:opacity-50"
            >
              <option value="">
                {{
                  !selectedTournamentId
                    ? 'Pick a tournament first'
                    : availableCategories.length
                      ? 'Select category'
                      : 'No matching categories'
                }}
              </option>
              <option
                v-for="c in availableCategories"
                :key="c.id"
                :value="c.id"
              >
                {{ c.name }} — {{ c.ageGroup }} — {{ c.discipline }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            :disabled="saving || !selectedCategoryId || !athleteId"
            @click="handleEnroll"
          >
            <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
            {{ saving ? 'Enrolling...' : 'Enroll' }}
          </button>
        </div>
      </section>

      <!-- Current enrollments -->
      <section class="space-y-4">
        <h2 class="text-lg font-semibold text-foreground">
          Current enrollments
        </h2>

        <div
          v-if="!dashboard?.categories?.length"
          class="rounded-3xl border border-line bg-surface py-12 text-center"
        >
          <h3 class="text-lg font-semibold text-foreground">No categories yet</h3>
          <p class="mt-2 text-sm text-muted">
            Use the form above to register for a tournament category.
          </p>
        </div>

        <div
          v-else
          class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          <div
            v-for="category in dashboard.categories"
            :key="category.id"
            class="rounded-3xl border border-line bg-surface p-5 transition hover:border-blue-500/30"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <h3 class="font-semibold text-foreground">
                  {{ category.name }}
                </h3>
                <p
                  v-if="category.tournament?.name"
                  class="mt-1 text-sm text-muted"
                >
                  {{ category.tournament.name }}
                </p>
              </div>
              <span
                v-if="category.seed"
                class="shrink-0 rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400"
              >
                Seed #{{ category.seed }}
              </span>
            </div>

            <div class="mt-5 space-y-3 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted">Discipline</span>
                <span class="font-medium text-foreground">
                  {{ formatDiscipline(category.discipline) }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted">Age Group</span>
                <span class="font-medium text-foreground">
                  {{ category.ageGroup || '—' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted">Gender</span>
                <span class="font-medium text-foreground">
                  {{ formatGender(category.gender) }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span class="text-muted">Weight</span>
                <span class="font-medium text-foreground">
                  {{ weightLabel(category) }}
                </span>
              </div>
            </div>

            <div class="mt-5">
              <NuxtLink
                :to="`/brackets/${category.id}`"
                class="inline-flex w-full items-center justify-center rounded-xl border border-line bg-panel px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-hover"
              >
                View Bracket
              </NuxtLink>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>