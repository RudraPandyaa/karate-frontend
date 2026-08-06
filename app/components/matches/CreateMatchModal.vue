<script setup lang="ts">
import { ref, computed, watch, toRefs } from 'vue'
import type { Match } from '~/types'
import type {
  CreateMatchPayload,
  MatchRound,
  MatchStatus,
} from '~/composables/useMatches'
import { useMatches } from '~/composables/useMatches'
import {
  X,
  Layers,
  MapPinned,
  ListOrdered,
  Activity,
  Timer,
  Clock,
  Swords,
  ArrowLeftRight,
  Loader2,
  ChevronDown,
} from 'lucide-vue-next'

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

// `scheduledTime` is kept in the <input type="datetime-local"> string format
// ("YYYY-MM-DDTHH:mm") here for direct v-model binding, and converted to/from
// an ISO string at the form's edges (openEdit / submit). Don't store the ISO
// string directly in the form, or the native datetime picker won't parse it.
const form = ref<CreateMatchPayload & { scheduledTime?: string }>({
  categoryId: '',
  tatamiId: '',
  round: 'ROUND_1',
  status: 'SCHEDULED' as MatchStatus,
  redAthleteId: '',
  blueAthleteId: '',
  timerSeconds: undefined,
  scheduledTime: '',
})

function timerSecondsForAgeGroup(
  ageGroup?: string,
  minAge?: number | null,
  maxAge?: number | null,
  discipline?: string | null,
  gender?: string | null,
): number {
  const disc = (discipline || '').toUpperCase()
  const age = (ageGroup || '').toUpperCase().trim()
  const g = (gender || '').toUpperCase()

  let band: 'U10' | 'U14' | 'CADET' | 'JUNIOR' | 'U21' | 'SENIOR' = 'SENIOR'

  if (maxAge != null) {
    if (maxAge <= 10) band = 'U10'
    else if (maxAge <= 14) band = 'U14'
    else if (maxAge <= 16) band = 'CADET'
    else if (maxAge <= 18) band = 'JUNIOR'
    else if (maxAge <= 21) band = 'U21'
    else band = 'SENIOR'
  } else if (minAge != null && minAge >= 18) {
    band = minAge >= 21 ? 'SENIOR' : 'U21'
  } else {
    if (/U\s*8|U\s*10|KIDS|CHILDREN|PEEWEE/i.test(age)) band = 'U10'
    else if (/U\s*12|U\s*14/i.test(age)) band = 'U14'
    else if (/U\s*16|CADET/i.test(age)) band = 'CADET'
    else if (/U\s*18|JUNIOR/i.test(age)) band = 'JUNIOR'
    else if (/U\s*21|UNDER\s*21/i.test(age)) band = 'U21'
    else if (/SENIOR|OPEN|ADULT|18\+|21\+/i.test(age)) band = 'SENIOR'
  }

  const isKumite = disc === 'KUMITE' || disc === 'TEAM_KUMITE'

  if (isKumite) {
    switch (band) {
      case 'U10': return 60
      case 'U14': return 90
      case 'CADET':
      case 'JUNIOR': return 120
      case 'U21': return g === 'FEMALE' ? 120 : 180
      default: return 180
    }
  }

  switch (band) {
    case 'U10': return 60
    case 'U14': return 90
    case 'CADET':
    case 'JUNIOR': return 120
    default: return 180
  }
}

/** ISO string -> value a <input type="datetime-local"> can display */
function toLocalInputValue(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** <input type="datetime-local"> value -> ISO string for the API */
function fromLocalInputValue(value?: string): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')

const safeAthletes = computed(() =>
  Array.isArray(athletes.value) ? athletes.value : []
)
const safeCategories = computed(() =>
  Array.isArray(categories.value) ? categories.value : []
)
const safeTatamis = computed(() =>
  Array.isArray(tatamis.value) ? tatamis.value : []
)

const selectedCategory = computed(() =>
  safeCategories.value.find((c) => c.id === form.value.categoryId)
)

const suggestedTimerSeconds = computed(() =>
  timerSecondsForAgeGroup(
    selectedCategory.value?.ageGroup || selectedCategory.value?.name,
    selectedCategory.value?.minAge,
    selectedCategory.value?.maxAge,
    selectedCategory.value?.discipline,
    selectedCategory.value?.gender,
  )
)

watch(
  () => form.value.categoryId,
  (newId) => {
    if (!newId) {
      form.value.timerSeconds = undefined
      return
    }
    if (!editingId.value) {
      form.value.timerSeconds = suggestedTimerSeconds.value
    } else if (form.value.timerSeconds == null) {
      form.value.timerSeconds = suggestedTimerSeconds.value
    }
  }
)

const athletesInCategory = computed(() => {
  if (!form.value.categoryId) return []
  return safeAthletes.value.filter(
    (athlete) =>
      Array.isArray(athlete.categories) &&
      athlete.categories.some((c: any) => c.id === form.value.categoryId)
  )
})

const redAthletes = computed(() =>
  athletesInCategory.value.filter(
    (athlete) => athlete.id !== form.value.blueAthleteId
  )
)
const blueAthletes = computed(() =>
  athletesInCategory.value.filter(
    (athlete) => athlete.id !== form.value.redAthleteId
  )
)

const selectedRedAthlete = computed(() =>
  safeAthletes.value.find((a) => a.id === form.value.redAthleteId)
)
const selectedBlueAthlete = computed(() =>
  safeAthletes.value.find((a) => a.id === form.value.blueAthleteId)
)

function swapCorners() {
  const red = form.value.redAthleteId
  form.value.redAthleteId = form.value.blueAthleteId
  form.value.blueAthleteId = red
}

function resetForm() {
  form.value = {
    categoryId: '',
    tatamiId: '',
    round: 'ROUND_1',
    status: 'SCHEDULED' as MatchStatus,
    redAthleteId: '',
    blueAthleteId: '',
    timerSeconds: undefined,
    scheduledTime: '',
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
    // @ts-expect-error scheduledTime isn't on Match yet — add it to the type once the backend supports it
    scheduledTime: toLocalInputValue(match.scheduledTime),
  }
}

watch(
  () => props.matchToEdit,
  (match) => {
    if (match) openEdit(match)
    else resetForm()
  },
  { immediate: true }
)

watch(
  () => form.value.categoryId,
  (newCategoryId) => {
    const validIds = new Set(
      safeAthletes.value
        .filter(
          (a) =>
            Array.isArray(a.categories) &&
            a.categories.some((c: any) => c.id === newCategoryId)
        )
        .map((a) => a.id)
    )
    if (form.value.redAthleteId && !validIds.has(form.value.redAthleteId)) {
      form.value.redAthleteId = ''
    }
    if (form.value.blueAthleteId && !validIds.has(form.value.blueAthleteId)) {
      form.value.blueAthleteId = ''
    }
  }
)

function getAthleteName(athlete?: any): string {
  if (!athlete) return 'No athlete selected'
  if (athlete.fullName) return athlete.fullName
  if (athlete.name) return athlete.name
  const parts = [athlete.firstName, athlete.middleName, athlete.lastName].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return `Athlete (${String(athlete.id || '').slice(0, 6)})`
}

function initials(athlete?: any): string {
  if (!athlete) return '?'
  const name = getAthleteName(athlete)
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const ISO3_TO_ISO2: Record<string, string> = {
  IND: 'IN', JPN: 'JP', KOR: 'KR', CHN: 'CN', USA: 'US',
  GBR: 'GB', FRA: 'FR', GER: 'DE', BRA: 'BR', AUS: 'AU',
  JOR: 'JO', ITA: 'IT',
}

function countryFlag(code?: string) {
  if (!code) return ''
  const iso2 = code.length === 2 ? code.toUpperCase() : ISO3_TO_ISO2[code.toUpperCase()]
  if (!iso2 || iso2.length !== 2) return ''
  return iso2.replace(/./g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt(0))
  )
}

function statusDotClass(status: MatchStatus) {
  switch (status) {
    case 'IN_PROGRESS': return 'bg-amber-500'
    case 'COMPLETED': return 'bg-emerald-500'
    case 'CANCELLED': return 'bg-rose-500'
    default: return 'bg-sky-500'
  }
}

async function submit() {
  formError.value = ''
  if (!form.value.categoryId) {
    formError.value = 'Please select a category to continue.'
    return
  }
  saving.value = true
  try {
    const payload: CreateMatchPayload & { scheduledTime?: string } = {
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
      // Left blank = "auto-schedule after the previous match on this tatami"
      scheduledTime: fromLocalInputValue(form.value.scheduledTime),
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

defineExpose({ resetForm })
</script>

<template>
  <div class="flex h-full flex-col bg-white text-slate-900">
    <!-- Header -->
    <div class="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Swords class="h-5 w-5" />
        </div>
        <div>
          <h2 class="text-lg font-bold leading-tight text-slate-900">
            {{ editingId ? 'Edit Match' : 'Create Match' }}
          </h2>
          <p class="mt-0.5 text-sm text-slate-500">
            {{ editingId ? 'Update the details for this match' : 'Schedule a new match for this tournament' }}
          </p>
        </div>
      </div>
      <button
        type="button"
        class="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        @click="emit('close')"
      >
        <X class="h-5 w-5" />
      </button>
    </div>

    <!-- Body -->
    <div class="flex-1 space-y-6 overflow-y-auto px-6 py-6">
      <!-- Match setup -->
      <section>
        <h3 class="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Match setup
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Layers class="h-3.5 w-3.5 text-slate-400" />
              Category <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <select
                v-model="form.categoryId"
                class="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
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
              <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <MapPinned class="h-3.5 w-3.5 text-slate-400" />
              Tatami
            </label>
            <div class="relative">
              <select
                v-model="form.tatamiId"
                class="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              >
                <option value="">Unassigned</option>
                <option
                  v-for="tatami in safeTatamis"
                  :key="tatami.id"
                  :value="tatami.id"
                >
                  {{ tatami.name || `Tatami ${tatami.number}` }}
                </option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <ListOrdered class="h-3.5 w-3.5 text-slate-400" />
              Round <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <select
                v-model="form.round"
                class="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              >
                <option v-for="round in roundOptions" :key="round" :value="round">
                  {{ round.replaceAll('_', ' ') }}
                </option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <div>
            <label class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Activity class="h-3.5 w-3.5 text-slate-400" />
              Status
            </label>
            <div class="relative">
              <span
                class="pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full"
                :class="statusDotClass(form.status)"
              />
              <select
                v-model="form.status"
                class="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-8 pr-9 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              >
                <option v-for="status in statusOptions" :key="status" :value="status">
                  {{ status.replaceAll('_', ' ') }}
                </option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            </div>
          </div>

          <!-- Scheduled start time -->
          <div class="sm:col-span-2">
            <label class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Clock class="h-3.5 w-3.5 text-slate-400" />
              Scheduled start time
            </label>
            <input
              v-model="form.scheduledTime"
              type="datetime-local"
              class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
            />
            <p class="mt-1.5 text-xs text-slate-500">
              Leave blank to auto-schedule this match right after the previous one on the same tatami.
            </p>
          </div>

          <div class="sm:col-span-2">
            <label class="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
              <Timer class="h-3.5 w-3.5 text-slate-400" />
              Match duration
            </label>
            <div class="flex items-center gap-3">
              <input
                v-model.number="form.timerSeconds"
                type="number"
                min="30"
                max="600"
                step="30"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                placeholder="Auto from age group"
              />
              <button
                v-if="form.categoryId"
                type="button"
                class="shrink-0 whitespace-nowrap rounded-lg bg-slate-100 px-3 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-200"
                @click="form.timerSeconds = suggestedTimerSeconds"
              >
                Use WKF {{ suggestedTimerSeconds }}s
              </button>
            </div>
            <p v-if="form.categoryId && selectedCategory" class="mt-1.5 text-xs text-slate-500">
              {{ selectedCategory.ageGroup || selectedCategory.name }} · {{ selectedCategory.discipline }}
            </p>
          </div>
        </div>
      </section>

      <!-- Matchup -->
      <section>
        <div class="mb-3 flex items-center justify-between">
          <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Matchup
          </h3>
          <button
            v-if="form.redAthleteId || form.blueAthleteId"
            type="button"
            class="flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
            @click="swapCorners"
          >
            <ArrowLeftRight class="h-3.5 w-3.5" />
            Swap corners
          </button>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <!-- AKA -->
          <div class="rounded-2xl border-2 border-rose-200 bg-rose-50/60 p-4 transition focus-within:border-rose-400">
            <div class="mb-3 flex items-center justify-between">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Aka · Red
              </span>
              <button
                v-if="form.redAthleteId"
                type="button"
                class="text-xs font-medium text-rose-500 hover:text-rose-700"
                @click="form.redAthleteId = ''"
              >
                Clear
              </button>
            </div>
            <div class="mb-3 flex items-center gap-3">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-rose-600 text-sm font-bold text-white ring-2 ring-white">
                <img
                  v-if="selectedRedAthlete?.photoUrl"
                  :src="selectedRedAthlete.photoUrl"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ initials(selectedRedAthlete) }}</span>
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-slate-900">
                  {{ getAthleteName(selectedRedAthlete) }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ countryFlag(selectedRedAthlete?.country) }}
                  {{ selectedRedAthlete?.country || 'No athlete selected' }}
                </p>
              </div>
            </div>
            <div class="relative">
              <select
                v-model="form.redAthleteId"
                class="w-full appearance-none rounded-xl border border-rose-300 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:ring-1 focus:ring-rose-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                :disabled="!form.categoryId"
              >
                <option value="">
                  {{ form.categoryId ? 'Select Aka athlete' : 'Select a category first' }}
                </option>
                <option
                  v-for="athlete in redAthletes"
                  :key="athlete.id"
                  :value="athlete.id"
                >
                  {{ getAthleteName(athlete) }}
                </option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-rose-300" />
            </div>
            <p
              v-if="form.categoryId && redAthletes.length === 0"
              class="mt-1.5 text-xs text-rose-500"
            >
              No athletes enrolled in this category yet.
            </p>
          </div>

          <!-- AO -->
          <div class="rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-4 transition focus-within:border-blue-400">
            <div class="mb-3 flex items-center justify-between">
              <span class="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
                Ao · Blue
              </span>
              <button
                v-if="form.blueAthleteId"
                type="button"
                class="text-xs font-medium text-blue-500 hover:text-blue-700"
                @click="form.blueAthleteId = ''"
              >
                Clear
              </button>
            </div>
            <div class="mb-3 flex items-center gap-3">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white ring-2 ring-white">
                <img
                  v-if="selectedBlueAthlete?.photoUrl"
                  :src="selectedBlueAthlete.photoUrl"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ initials(selectedBlueAthlete) }}</span>
              </div>
              <div class="min-w-0">
                <p class="truncate text-sm font-semibold text-slate-900">
                  {{ getAthleteName(selectedBlueAthlete) }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ countryFlag(selectedBlueAthlete?.country) }}
                  {{ selectedBlueAthlete?.country || 'No athlete selected' }}
                </p>
              </div>
            </div>
            <div class="relative">
              <select
                v-model="form.blueAthleteId"
                class="w-full appearance-none rounded-xl border border-blue-300 bg-white px-3 py-2.5 pr-9 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                :disabled="!form.categoryId"
              >
                <option value="">
                  {{ form.categoryId ? 'Select Ao athlete' : 'Select a category first' }}
                </option>
                <option
                  v-for="athlete in blueAthletes"
                  :key="athlete.id"
                  :value="athlete.id"
                >
                  {{ getAthleteName(athlete) }}
                </option>
              </select>
              <ChevronDown class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-300" />
            </div>
            <p
              v-if="form.categoryId && blueAthletes.length === 0"
              class="mt-1.5 text-xs text-blue-500"
            >
              No athletes enrolled in this category yet.
            </p>
          </div>
        </div>
      </section>

      <div
        v-if="formError"
        class="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
      >
        {{ formError }}
      </div>
    </div>

    <!-- Footer -->
    <div class="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
      <button
        type="button"
        class="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        @click="emit('close')"
      >
        Cancel
      </button>
      <button
        type="button"
        :disabled="saving"
        class="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        @click="submit"
      >
        <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
        {{ saving ? 'Saving…' : editingId ? 'Update Match' : 'Create Match' }}
      </button>
    </div>
  </div>
</template>