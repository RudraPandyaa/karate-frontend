<script setup lang="ts">
import { ref, computed, watch, toRefs } from 'vue'
import type { Match } from '~/types'
import type {
  CreateMatchPayload,
  MatchRound,
  MatchStatus,
} from '~/composables/useMatches'
import { useMatches } from '~/composables/useMatches'

const { createMatch, updateMatch } = useMatches()

const props = defineProps<{
  categories: any[]
  athletes: any[]
  tatamis?: any[]
  matchToEdit?: Match | null
}>()

const { athletes, categories, tatamis } = toRefs(props)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
  (e: 'updated', matchId: string): void
}>()

const roundOptions: MatchRound[] = [
  'ROUND_1',
  'ROUND_2',
  'ROUND_3',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'QUARTERFINAL',
  'SEMI_FINAL',
  'SEMIFINAL',
  'FINAL',
  'FINAL_MATCH',
  'REPECHAGE',
  'BRONZE',
  'BRONZE_MEDAL',
]

const statusOptions: MatchStatus[] = [
  'SCHEDULED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
] as MatchStatus[]

const form = ref<CreateMatchPayload>({
  categoryId: '',
  tatamiId: '',
  round: 'ROUND_1',
  status: 'SCHEDULED' as MatchStatus,
  redAthleteId: '',
  blueAthleteId: '',
})

const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')

/* -----------------------------
 * Athlete Lists
 * ----------------------------- */

const safeAthletes = computed(() =>
  Array.isArray(athletes.value) ? athletes.value : []
)

const safeCategories = computed(() =>
  Array.isArray(categories.value) ? categories.value : []
)

const safeTatamis = computed(() =>
  Array.isArray(tatamis.value) ? tatamis.value : []
)

/**
 * Prevent selecting the same athlete
 * in both AKA and AO corners.
 */
const redAthletes = computed(() =>
  safeAthletes.value.filter(
    athlete => athlete.id !== form.value.blueAthleteId
  )
)

const blueAthletes = computed(() =>
  safeAthletes.value.filter(
    athlete => athlete.id !== form.value.redAthleteId
  )
)

/* -----------------------------
 * Selected Athletes
 * ----------------------------- */

const selectedRedAthlete = computed(() =>
  safeAthletes.value.find(
    athlete => athlete.id === form.value.redAthleteId
  )
)

const selectedBlueAthlete = computed(() =>
  safeAthletes.value.find(
    athlete => athlete.id === form.value.blueAthleteId
  )
)

/* -----------------------------
 * Helpers
 * ----------------------------- */

function resetForm() {
  form.value = {
    categoryId: '',
    tatamiId: '',
    round: 'ROUND_1',
    status: 'SCHEDULED' as MatchStatus,
    redAthleteId: '',
    blueAthleteId: '',
  }

  editingId.value = null
  formError.value = ''
}

function openEdit(match: Match) {
  editingId.value = match.id

  form.value = {
    categoryId: match.categoryId,
    tatamiId: match.tatamiId || '',
    round: match.round as MatchRound,
    status: match.status as MatchStatus,
    redAthleteId: match.redAthleteId || '',
    blueAthleteId: match.blueAthleteId || '',
    refereeId: match.refereeId || '',
    scorekeeperId: match.scorekeeperId || '',
    bracketSlot: match.bracketSlot,
    timerSeconds: match.timerSeconds,
  }
}

/**
 * Automatically load match data
 * when editing.
 */
watch(
  () => props.matchToEdit,
  match => {
    if (match) {
      openEdit(match)
    } else {
      resetForm()
    }
  },
  {
    immediate: true,
  }
)

/**
 * Convert a country code (IN, JP, FR...)
 * into an emoji flag. Falls back to an empty
 * string for missing/invalid codes so we never
 * render mojibake for undefined values.
 */
function countryFlag(code?: string) {
  if (!code || code.length !== 2) return ''

  return code
    .toUpperCase()
    .replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    )
}

/* -----------------------------
 * Submit Form
 * ----------------------------- */

async function submit() {
  formError.value = ''

  // Required category
  if (!form.value.categoryId) {
    formError.value = 'Please select a category.'
    return
  }

  // Prevent same athlete in both corners
  if (
    form.value.redAthleteId &&
    form.value.blueAthleteId &&
    form.value.redAthleteId === form.value.blueAthleteId
  ) {
    formError.value =
      'AKA (Red) and AO (Blue) athletes must be different.'
    return
  }

  saving.value = true

  try {
    const payload: CreateMatchPayload = {
      categoryId: form.value.categoryId,
      tatamiId: form.value.tatamiId || undefined,
      round: form.value.round,
      status: form.value.status,

      redAthleteId: form.value.redAthleteId || undefined,
      blueAthleteId: form.value.blueAthleteId || undefined,

      refereeId: form.value.refereeId || undefined,
      scorekeeperId: form.value.scorekeeperId || undefined,

      bracketSlot: form.value.bracketSlot,
      timerSeconds: form.value.timerSeconds,
    }

    if (editingId.value) {
      await updateMatch(editingId.value, payload)
      emit('updated', editingId.value)
    } else {
      await createMatch(payload)
      emit('created')
    }

    resetForm()
    emit('close')
  } catch (err: any) {
    formError.value =
      err?.data?.message || err?.message || 'Failed to save match.'
  } finally {
    saving.value = false
  }
}

/* -----------------------------
 * Expose
 * ----------------------------- */

defineExpose({
  resetForm,
})
</script>

<template>
  <div class="grid gap-6 md:grid-cols-2">
    <!-- Category -->
    <div>
      <label class="mb-1 block text-sm text-gray-400">Category</label>
      <select
        v-model="form.categoryId"
        class="w-full rounded-xl border border-gray-600 bg-surface px-4 py-3 focus:border-primary-500"
      >
        <option value="">Select category</option>
        <option
          v-for="category in safeCategories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </option>
      </select>
    </div>

    <!-- Tatami -->
    <div>
      <label class="mb-1 block text-sm text-gray-400">Tatami</label>
      <select
        v-model="form.tatamiId"
        class="w-full rounded-xl border border-gray-600 bg-surface px-4 py-3 focus:border-primary-500"
      >
        <option value="">Select tatami</option>
        <option
          v-for="tatami in safeTatamis"
          :key="tatami.id"
          :value="tatami.id"
        >
          {{ tatami.name }}
        </option>
      </select>
    </div>

    <!-- Round -->
    <div>
      <label class="mb-1 block text-sm text-gray-400">Round</label>
      <select
        v-model="form.round"
        class="w-full rounded-xl border border-gray-600 bg-surface px-4 py-3 focus:border-primary-500"
      >
        <option v-for="round in roundOptions" :key="round" :value="round">
          {{ round }}
        </option>
      </select>
    </div>

    <!-- Status -->
    <div>
      <label class="mb-1 block text-sm text-gray-400">Status</label>
      <select
        v-model="form.status"
        class="w-full rounded-xl border border-gray-600 bg-surface px-4 py-3 focus:border-primary-500"
      >
        <option v-for="status in statusOptions" :key="status" :value="status">
          {{ status }}
        </option>
      </select>
    </div>

    <!-- Athlete Selection -->
    <div class="col-span-2 grid gap-6 md:grid-cols-2">
      <!-- RED CORNER -->
      <div class="rounded-2xl border border-red-600/40 bg-red-950/20 p-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold text-red-400">AKA (Red)</h3>

          <button
            v-if="form.redAthleteId"
            type="button"
            class="text-xs text-red-300 hover:text-red-200"
            @click="form.redAthleteId = ''"
          >
            Clear
          </button>
        </div>

        <!-- Preview -->
        <div class="mb-4 flex items-center gap-3">
          <img
            v-if="selectedRedAthlete?.photoUrl"
            :src="selectedRedAthlete.photoUrl"
            class="h-14 w-14 rounded-full border border-red-600 object-cover"
          >
          <div
            v-else
            class="flex h-14 w-14 items-center justify-center rounded-full bg-red-900 text-xl"
          >
            👤
          </div>

          <div>
            <div class="font-medium">
              {{ selectedRedAthlete?.name || 'No athlete selected' }}
            </div>

            <div class="text-sm text-gray-400">
              {{ countryFlag(selectedRedAthlete?.country) }}
              {{ selectedRedAthlete?.country }}
            </div>
          </div>
        </div>

        <!-- Select -->
        <select
          v-model="form.redAthleteId"
          class="w-full rounded-xl border border-red-600 bg-surface px-4 py-3 focus:border-red-500"
        >
          <option value="">Select AKA Athlete</option>
          <option
            v-for="athlete in redAthletes"
            :key="athlete.id"
            :value="athlete.id"
          >
            {{ athlete.name }} {{ countryFlag(athlete.country) }}
          </option>
        </select>
      </div>

      <!-- BLUE CORNER -->
      <div class="rounded-2xl border border-blue-600/40 bg-blue-950/20 p-4">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="font-semibold text-blue-400">AO (Blue)</h3>

          <button
            v-if="form.blueAthleteId"
            type="button"
            class="text-xs text-blue-300 hover:text-blue-200"
            @click="form.blueAthleteId = ''"
          >
            Clear
          </button>
        </div>

        <!-- Preview -->
        <div class="mb-4 flex items-center gap-3">
          <img
            v-if="selectedBlueAthlete?.photoUrl"
            :src="selectedBlueAthlete.photoUrl"
            class="h-14 w-14 rounded-full border border-blue-600 object-cover"
          >
          <div
            v-else
            class="flex h-14 w-14 items-center justify-center rounded-full bg-blue-900 text-xl"
          >
            👤
          </div>

          <div>
            <div class="font-medium">
              {{ selectedBlueAthlete?.name || 'No athlete selected' }}
            </div>

            <div class="text-sm text-gray-400">
              {{ countryFlag(selectedBlueAthlete?.country) }}
              {{ selectedBlueAthlete?.country }}
            </div>
          </div>
        </div>

        <!-- Select -->
        <select
          v-model="form.blueAthleteId"
          class="w-full rounded-xl border border-blue-600 bg-surface px-4 py-3 focus:border-blue-500"
        >
          <option value="">Select AO Athlete</option>
          <option
            v-for="athlete in blueAthletes"
            :key="athlete.id"
            :value="athlete.id"
          >
            {{ athlete.name }} {{ countryFlag(athlete.country) }}
          </option>
        </select>
      </div>
    </div>

    <!-- Error -->
    <p v-if="formError" class="col-span-2 text-sm text-red-400">
      {{ formError }}
    </p>

    <!-- Actions -->
    <div class="col-span-2 flex justify-end gap-3">
      <button
        type="button"
        class="rounded-xl border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800"
        @click="emit('close')"
      >
        Cancel
      </button>

      <button
        type="button"
        :disabled="saving"
        class="rounded-xl bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-500 disabled:opacity-50"
        @click="submit"
      >
        {{ saving ? 'Saving…' : editingId ? 'Update Match' : 'Create Match' }}
      </button>
    </div>
  </div>
</template>