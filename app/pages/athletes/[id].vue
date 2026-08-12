<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { Plus, X, Trophy, Pencil, Trash2, Copy, Check } from 'lucide-vue-next'
import { useAthletes, getAthleteIdNumber } from '~/composables/useAthletes'
import { useCategories } from '~/composables/useCategories'
import CountryFlag from 'vue-country-flag-next'
import { COUNTRY_CODE_MAP } from '~/utils/countries'
import EnrollAthleteModal from '~/components/athletes/EnrollAthleteModal.vue'
definePageMeta({
  layout: 'athlete',
  middleware: 'athlete',
})
const route = useRoute()
const athleteId = route.params.id as string

const {
  enrollments,
  histories,
  pending,
  saving,
  error,
  getAthlete,
  fetchEnrollments,
  enrollAthlete,
  unenrollAthlete,
  fetchHistory,
  addHistory,
  updateHistory,
  removeHistory,
} = useAthletes()

const { rows: categories, tournaments, fetchCategories, fetchTournaments } = useCategories()

const athlete = ref<any>(null)
const showEnrollModal = ref(false)
const showHistoryModal = ref(false)
const editingHistory = ref<any>(null)

const historyForm = ref({
  year: new Date().getFullYear(),
  medal: '' as '' | 'GOLD' | 'SILVER' | 'BRONZE',
  position: undefined as number | undefined,
  tournamentId: '',
  categoryId: '',
})

const copied = ref(false)

async function copyAthleteId() {
  if (!athlete.value) return

  const id = getAthleteIdNumber(athlete.value)

  try {
    await navigator.clipboard.writeText(id)
    copied.value = true

    // Reset back to Copy icon after 2 seconds
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy ID', err)
  }
}

// Auto-fill position based on medal; leave it untouched/empty when medal is cleared
watch(() => historyForm.value.medal, (medal) => {
  if (medal === 'GOLD') historyForm.value.position = 1
  else if (medal === 'SILVER') historyForm.value.position = 2
  else if (medal === 'BRONZE') historyForm.value.position = 3
  else historyForm.value.position = undefined
})

onMounted(async () => {
  athlete.value = await getAthlete(athleteId)
  await Promise.all([
    fetchEnrollments(athleteId),
    fetchHistory(athleteId),
    fetchCategories(),
    fetchTournaments(),
  ])
})

function getDisplayName(a: any) {
  return a?.fullName || [a?.firstName, a?.lastName].filter(Boolean).join(' ') || 'Athlete'
}

const enrolledCategoryIds = computed(() =>
  enrollments.value.map((e) => e.categoryId),
)

async function handleEnroll(payload: { categoryId: string; seed?: number }) {
  try {
    await enrollAthlete(athleteId, payload)
    showEnrollModal.value = false
  } catch (err: any) {
    const status = err?.statusCode || err?.status || err?.response?.status
    const msg =
      err?.data?.message ||
      err?.message ||
      'Failed to enroll'

    if (status === 409 || String(msg).toLowerCase().includes('already')) {
      alert('Already enrolled in this category.')
    } else {
      alert(msg)
    }
  }
}

async function handleUnenroll(categoryId: string) {
  try {
    await unenrollAthlete(athleteId, categoryId)
  } catch (err) {
    console.error(err)
  }
}

function openAddHistory() {
  editingHistory.value = null
  historyForm.value = {
    year: new Date().getFullYear(),
    medal: '',
    position: undefined,
    tournamentId: '',
    categoryId: '',
  }
  showHistoryModal.value = true
}

function openEditHistory(item: any) {
  editingHistory.value = item
  historyForm.value = {
    year: item.year,
    medal: item.medal || '',
    position: item.position || undefined,
    tournamentId: item.tournamentId || '',
    categoryId: item.categoryId || '',
  }
  showHistoryModal.value = true
}

async function saveHistory() {
  try {
    const payload = {
      year: Number(historyForm.value.year),
      medal: historyForm.value.medal || undefined,
      position: historyForm.value.position ? Number(historyForm.value.position) : undefined,
      tournamentId: historyForm.value.tournamentId || undefined,
      categoryId: historyForm.value.categoryId || undefined,
    }

    if (editingHistory.value) {
      await updateHistory(editingHistory.value.id, payload)
      await fetchHistory(athleteId)
    } else {
      await addHistory(athleteId, payload)
    }

    showHistoryModal.value = false
  } catch (err) {
    console.error(err)
    alert('Failed to save history')
  }
}

async function deleteHistory(id: string) {
  if (!confirm('Delete this history record?')) return
  try {
    await removeHistory(id)
  } catch (err) {
    console.error(err)
  }
}

const medalColor: Record<string, string> = {
  GOLD: 'text-yellow-400',
  SILVER: 'text-gray-300',
  BRONZE: 'text-orange-400',
}
</script>

<template>
  <div class="space-y-8">

    <!-- Header -->
    <div v-if="athlete" class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-16 h-16 rounded-2xl overflow-hidden border border-line bg-surface shrink-0">
          <img
            v-if="athlete.photoUrl"
            :src="athlete.photoUrl"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-xl font-bold text-muted">
            {{ getDisplayName(athlete).charAt(0) }}
          </div>
        </div>

        <div>
          <h1 class="text-3xl font-bold text-foreground">
            {{ getDisplayName(athlete) }}
          </h1>

         <!-- ID Number with Copy -->
        <div class="mt-1 flex items-center gap-2">
          <p class="font-mono text-sm font-medium text-blue-400">
            ID: {{ getAthleteIdNumber(athlete) }}
          </p>

          <button
            class="rounded-lg p-1.5 text-muted transition hover:bg-surface-hover hover:text-foreground"
            :title="copied ? 'Copied!' : 'Copy ID'"
            @click="copyAthleteId"
          >
            <Check
              v-if="copied"
              class="h-4 w-4 text-green-500"
            />
            <Copy
              v-else
              class="h-4 w-4"
            />
          </button>
        </div>

          <div class="mt-1 flex items-center gap-2 text-sm text-muted">
            <CountryFlag
              v-if="COUNTRY_CODE_MAP[athlete.country]"
              :country="COUNTRY_CODE_MAP[athlete.country]"
              size="small"
            />
            <span>{{ athlete.state }}, {{ athlete.country }}</span>
          </div>
        </div>
      </div>

      <button
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
    
        @click="
        console.log('Enroll clicked');
          showEnrollModal = true
        "
      >
        <Plus class="h-4 w-4" />
        Enroll in Category
      </button>
    </div>

    <div v-if="error" class="rounded-xl border border-red-500 bg-red-500/10 p-4 text-red-400">
      {{ error }}
    </div>

    <!-- ===================== ENROLLMENTS ===================== -->
    <section>
      <h2 class="text-lg font-semibold text-foreground mb-4">Current Enrollments</h2>

      <div v-if="pending" class="rounded-2xl border border-line bg-surface py-12 text-center text-muted">
        Loading...
      </div>

      <div
        v-else-if="enrollments.length === 0"
        class="rounded-2xl border border-line bg-surface py-12 text-center"
      >
        <p class="text-muted">Not enrolled in any category yet.</p>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2">
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
              <p v-if="enrollment.seed" class="mt-1 text-sm text-muted">
                Seed #{{ enrollment.seed }}
              </p>
            </div>
            <button
              class="rounded-lg p-2 text-muted hover:bg-red-500/10 hover:text-red-400"
              @click="handleUnenroll(enrollment.categoryId)"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ===================== CHAMPIONSHIP HISTORY ===================== -->
    <section>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
          <Trophy class="h-5 w-5 text-yellow-500" />
          Championship History
        </h2>
        <button
          class="inline-flex items-center gap-2 rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface transition"
          @click="openAddHistory"
        >
          <Plus class="h-4 w-4" />
          Add Record
        </button>
      </div>

      <div v-if="histories.length === 0" class="rounded-2xl border border-line bg-surface py-12 text-center">
        <p class="text-muted">No championship history yet.</p>
      </div>

      <div v-else class="rounded-2xl border border-line bg-surface overflow-hidden">
        <table class="w-full">
          <thead class="bg-canvas/60">
            <tr>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Year</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Tournament</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Medal</th>
              <th class="px-5 py-3 text-left text-xs font-semibold uppercase text-muted">Position</th>
              <th class="px-5 py-3 text-right text-xs font-semibold uppercase text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in histories"
              :key="item.id"
              class="border-t border-line hover:bg-surface-hover"
            >
              <td class="px-5 py-3 font-medium">{{ item.year }}</td>
              <td class="px-5 py-3 text-sm">
                {{ item.tournament?.name || '—' }}
              </td>
              <td class="px-5 py-3">
                <span
                  v-if="item.medal"
                  class="font-semibold"
                  :class="medalColor[item.medal]"
                >
                  {{ item.medal }}
                </span>
                <span v-else class="text-muted">—</span>
              </td>
              <td class="px-5 py-3 text-sm text-muted">
                {{ item.position ? `#${item.position}` : '—' }}
              </td>
              <td class="px-5 py-3 text-right space-x-2">
                <button class="text-muted hover:text-foreground" @click="openEditHistory(item)">
                  <Pencil class="h-4 w-4 inline" />
                </button>
                <button class="text-red-400 hover:text-red-300" @click="deleteHistory(item.id)">
                  <Trash2 class="h-4 w-4 inline" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Enroll Modal (existing) -->
    <EnrollAthleteModal
      :open="showEnrollModal"
      :loading="saving"
      :tournaments="tournaments"
      :categories="categories"
      :enrolled-category-ids="enrolledCategoryIds"
      @close="showEnrollModal = false"
      @submit="handleEnroll"
    />

    <!-- History Modal -->
    <Teleport to="body">
      <div
        v-if="showHistoryModal"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="w-full max-w-md rounded-3xl border border-line bg-panel shadow-2xl">
          <div class="flex items-center justify-between border-b border-line px-6 py-5">
            <h3 class="text-lg font-bold">
              {{ editingHistory ? 'Edit History' : 'Add Championship Record' }}
            </h3>
            <button @click="showHistoryModal = false" class="p-2 rounded-lg hover:bg-surface">
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium mb-1.5">Year *</label>
              <input
                v-model.number="historyForm.year"
                type="number"
                min="1990"
                max="2100"
                class="w-full rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Medal</label>
              <select
                v-model="historyForm.medal"
                class="w-full rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-blue-600"
              >
                <option value="">None</option>
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="BRONZE">Bronze</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Position</label>
              <input
                v-model.number="historyForm.position"
                type="number"
                min="1"
                placeholder="e.g. 1"
                class="w-full rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-1.5">Tournament (optional)</label>
              <select
                v-model="historyForm.tournamentId"
                class="w-full rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-blue-600"
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
          </div>

          <div class="flex justify-end gap-3 border-t border-line px-6 py-5">
            <button
              class="rounded-xl border border-line px-5 py-2.5 hover:bg-surface"
              @click="showHistoryModal = false"
            >
              Cancel
            </button>
            <button
              class="rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700"
              :disabled="saving"
              @click="saveHistory"
            >
              {{ editingHistory ? 'Update' : 'Add Record' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>