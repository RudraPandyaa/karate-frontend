<script setup lang="ts">
import { Plus, X } from 'lucide-vue-next'
import { useAthletes } from '~/composables/useAthletes'
import { useCategories } from '~/composables/useCategories'

const route = useRoute()
const athleteId = route.params.id as string

const {
  enrollments,
  pending,
  saving,
  error,
  getAthlete,
  fetchEnrollments,
  enrollAthlete,
  unenrollAthlete,
} = useAthletes()

const { rows: categories, tournaments, fetchCategories, fetchTournaments } = useCategories()

const athlete = ref<Awaited<ReturnType<typeof getAthlete>> | null>(null)
const showEnrollModal = ref(false)

onMounted(async () => {
  athlete.value = await getAthlete(athleteId)
  await Promise.all([
    fetchEnrollments(athleteId),
    fetchCategories(),
    fetchTournaments(),
  ])
})

async function handleEnroll(payload: { categoryId: string; seed?: number }) {
  try {
    await enrollAthlete(athleteId, payload)
    showEnrollModal.value = false
  } catch (err) {
    console.error(err)
  }
}

async function handleUnenroll(categoryId: string) {
  try {
    await unenrollAthlete(athleteId, categoryId)
  } catch (err) {
    console.error(err)
  }
}
</script>

<template>
  <div class="space-y-6">

    <div
      v-if="athlete"
      class="flex items-center justify-between"
    >
      <div>
        <h1 class="text-3xl font-bold text-foreground">
          {{ athlete.name }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{ athlete.state }}, {{ athlete.country }}
        </p>
      </div>

      <button
        class="btn btn-primary flex items-center gap-2"
        @click="showEnrollModal = true"
      >
        <Plus class="h-4 w-4" />
        Enroll in Category
      </button>
    </div>

    <div
      v-if="error"
      class="rounded-xl border border-red-500 bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </div>

    <div
      v-if="pending"
      class="rounded-2xl border border-line bg-surface py-16 text-center text-muted"
    >
      Loading...
    </div>

    <div
      v-else-if="enrollments.length === 0"
      class="rounded-2xl border border-line bg-surface py-20 text-center"
    >
      <h3 class="text-lg font-semibold text-foreground">
        Not enrolled in any category yet
      </h3>
      <p class="mt-2 text-muted">
        Click "Enroll in Category" to register this athlete for an event.
      </p>
    </div>

    <div
      v-else
      class="grid gap-4 sm:grid-cols-2"
    >
      <div
        v-for="enrollment in enrollments"
        :key="enrollment.id"
        class="rounded-2xl border border-line bg-surface p-5"
      >
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs uppercase tracking-wide text-muted">
              {{ enrollment.category.tournament.name }}
            </p>
            <h3 class="mt-1 font-semibold text-foreground">
              {{ enrollment.category.name }}
            </h3>
            <p
              v-if="enrollment.seed"
              class="mt-1 text-sm text-muted"
            >
              Seed #{{ enrollment.seed }}
            </p>
          </div>

          <button
            class="rounded-lg p-2 text-muted transition hover:bg-red-500/10 hover:text-red-400"
            title="Remove enrollment"
            @click="handleUnenroll(enrollment.categoryId)"
          >
            <X class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <EnrollAthleteModal
      :open="showEnrollModal"
      :loading="saving"
      :tournaments="tournaments"
      :categories="categories"
      @close="showEnrollModal = false"
      @submit="handleEnroll"
    />

  </div>
</template> 