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
  matchToEdit?: Match |null
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

const safeAthletes = computed(() =>
  Array.isArray(athletes.value) ? athletes.value : []
)

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

function resetForm() {
  form.value = {
    categoryId: '',
    tatamiId: '',
    round: 'ROUND_1',
    status: 'SCHEDULED',
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

async function submit() {
  formError.value = ''

  if (!form.value.categoryId) {
    formError.value = 'Please select a category.'
    return
  }

  if (
    form.value.redAthleteId &&
    form.value.blueAthleteId &&
    form.value.redAthleteId === form.value.blueAthleteId
  ) {
    formError.value =
      'Red and Blue athletes must be different.'
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
      err?.data?.message ||
      err?.message ||
      'Failed to save match.'
  } finally {
    saving.value = false
  }
}

defineExpose({
  resetForm,
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div class="w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-panel">

      <!-- Header -->
      <div class="flex items-center justify-between border-b border-line px-6 py-5">
        <h2 class="text-xl font-semibold text-foreground">
          {{ editingId ? 'Edit Match' : 'Create New Match' }}
        </h2>

        <button
          class="text-muted transition hover:text-foreground"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <!-- Body -->
      <div class="space-y-6 p-6">

        <div
          v-if="formError"
          class="rounded-xl border border-red-700 bg-red-950/60 px-4 py-3 text-sm text-red-300"
        >
          {{ formError }}
        </div>

        <div class="grid grid-cols-2 gap-4">

          <!-- Category -->
          <div>
            <label class="mb-1 block text-xs text-foreground/50">
              Category
            </label>

            <select
              v-model="form.categoryId"
              class="w-full rounded-xl border border-line bg-surface px-4 py-3"
            >
              <option value="">
                Select category
              </option>

              <option
                v-for="category in categories"
                :key="category.id"
                :value="category.id"
              >
                {{ category.name }}
              </option>

            </select>
          </div>

          <!-- Tatami -->
          <div>
            <label class="mb-1 block text-xs text-foreground/50">
              Tatami
            </label>

            <select
              v-model="form.tatamiId"
              class="w-full rounded-xl border border-line bg-surface px-4 py-3"
            >
              <option value="">
                Unassigned
              </option>

              <option
                v-for="tatami in tatamis"
                :key="tatami.id"
                :value="tatami.id"
              >
                Tatami {{ tatami.number }}
              </option>

            </select>
          </div>

          <!-- Round -->
          <div>
            <label class="mb-1 block text-xs text-foreground/50">
              Round
            </label>

            <select
              v-model="form.round"
              class="w-full rounded-xl border border-line bg-surface px-4 py-3"
            >

              <option
                v-for="round in roundOptions"
                :key="round"
                :value="round"
              >
                {{ round.replaceAll('_', ' ') }}
              </option>

            </select>
          </div>

          <!-- Status -->
          <div>
            <label class="mb-1 block text-xs text-foreground/50">
              Status
            </label>

            <select
              v-model="form.status"
              class="w-full rounded-xl border border-line bg-surface px-4 py-3"
            >
              <option value="SCHEDULED">
                Scheduled
              </option>

              <option value="IN_PROGRESS">
                In Progress
              </option>

              <option value="PAUSED">
                Paused
              </option>

              <option value="COMPLETED">
                Completed
              </option>

            </select>
          </div>

          <!-- Red Athlete -->
          <div>
            <label class="mb-1 block text-xs text-foreground/50">
              Red Corner Athlete
            </label>

            <div class="flex items-center gap-3">

              <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">

                <img
                  v-if="selectedRedAthlete?.photoUrl"
                  :src="selectedRedAthlete.photoUrl"
                  class="h-full w-full object-cover"
                >

                <div
                  v-else
                  class="text-xs text-muted"
                >
                  —
                </div>

              </div>

              <select
                v-model="form.redAthleteId"
                class="flex-1 rounded-xl border border-line bg-surface px-4 py-3"
              >
                <option value="">
                  TBD
                </option>

                <option
                  v-for="athlete in safeAthletes"
                  :key="athlete.id"
                  :value="athlete.id"
                >
                  {{ athlete.name }}
                </option>

              </select>

            </div>
          </div>

          <!-- Blue Athlete -->
          <div>
            <label class="mb-1 block text-xs text-foreground/50">
              Blue Corner Athlete
            </label>

            <div class="flex items-center gap-3">

              <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface">

                <img
                  v-if="selectedBlueAthlete?.photoUrl"
                  :src="selectedBlueAthlete.photoUrl"
                  class="h-full w-full object-cover"
                >

                <div
                  v-else
                  class="text-xs text-muted"
                >
                  —
                </div>

              </div>

              <select
                v-model="form.blueAthleteId"
                class="flex-1 rounded-xl border border-line bg-surface px-4 py-3"
              >
                <option value="">
                  TBD
                </option>

                <option
                  v-for="athlete in safeAthletes"
                  :key="athlete.id"
                  :value="athlete.id"
                >
                  {{ athlete.name }}
                </option>

              </select>

            </div>
          </div>

        </div>

      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 border-t border-line px-6 py-5">

        <button
          class="rounded-2xl bg-surface px-6 py-3 font-medium transition hover:bg-surface-hover"
          @click="$emit('close')"
        >
          Cancel
        </button>

        <button
          :disabled="saving"
          class="rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
          @click="submit"
        >
          {{ saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Match' }}
        </button>

      </div>

    </div>
  </div>
</template>