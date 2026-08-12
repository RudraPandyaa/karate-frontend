
<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'admin',
})
const {
  matches,
  pending: matchesPending,
  error: matchesError,
  fetchAll,
  createMatch,
  updateMatch,
  deleteMatch,
  regenerateBracket,
} = useMatches()

const { rows: categories, fetchCategories } = useCategories()
const { athletes, fetchAthletes } = useAthletes()
const { rows: tatamis, fetchTatami } = useTatami()
const { referees, fetchReferees } = useReferees()
const scorekeepers = ref<{ id: string; name: string; email: string }[]>([])
const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref<string | null>(null)


async function fetchScorekeepers() {
  const { api } = useApi()
  scorekeepers.value = await api('/users/by-role/SCOREKEEPER')
}



const form = reactive({
  categoryId: '',
  tatamiId: '',
  round: '',
  redAthleteId: '',
  blueAthleteId: '',
  status: 'SCHEDULED',
  timerSeconds: undefined as number | undefined,
  // Kept as a datetime-local input string ("YYYY-MM-DDTHH:mm") for direct
  // v-model binding; converted to/from ISO at submit()/startEdit().
  scheduledTime: '',
  refereeId: '',
  scorekeeperId: '',
})

const roundOptions = [
  { value: 'ROUND_1', label: 'Round 1' },
  { value: 'ROUND_2', label: 'Round 2' },
  { value: 'ROUND_3', label: 'Round 3' },
  { value: 'ROUND_OF_32', label: 'Round of 32' },
  { value: 'ROUND_OF_16', label: 'Round of 16' },
  { value: 'QUARTER_FINAL', label: 'Quarter Final' },
  { value: 'SEMI_FINAL', label: 'Semi Final' },
  { value: 'FINAL', label: 'Final' },
  { value: 'REPECHAGE', label: 'Repechage' },
  { value: 'BRONZE', label: 'Bronze Medal Match' },
]

const selectedCategory = computed(() =>
  categories.value.find((c) => c.id === form.categoryId)
)

/** WKF-oriented duration from category age group + name + discipline */
function timerSecondsForCategory(c?: any): number {
  if (!c) return 180

  const disc = (c.discipline || '').toUpperCase()
  const age = `${c.ageGroup || ''} ${c.name || ''}`.toUpperCase()
  const g = (c.gender || '').toUpperCase()
  const maxAge = c.maxAge ?? null
  const minAge = c.minAge ?? null

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
    if (/U\s*8|U\s*10|KIDS|CHILDREN|PEEWEE/.test(age)) band = 'U10'
    else if (/U\s*12|U\s*14/.test(age)) band = 'U14'
    else if (/U\s*16|CADET/.test(age)) band = 'CADET'
    else if (/U\s*18|JUNIOR/.test(age)) band = 'JUNIOR'
    else if (/U\s*21|UNDER\s*21/.test(age)) band = 'U21'
    else if (/SENIOR|OPEN|ADULT|18\+|21\+/.test(age)) band = 'SENIOR'
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

  // Kata / Team Kata soft limit
  switch (band) {
    case 'U10': return 60
    case 'U14': return 90
    case 'CADET':
    case 'JUNIOR': return 120
    default: return 180
  }
}

const suggestedTimerSeconds = computed(() =>
  timerSecondsForCategory(selectedCategory.value)
)

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

/** Full date + time for the match list (not tatami-scoped, so a bare "HH:mm" isn't enough here) */
function formatScheduledTime(iso?: string | null): string | null {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function athleteName(a: any): string {
  if (!a) return ''
  if (a.fullName) return a.fullName
  if (a.name) return a.name
  const parts = [a.firstName, a.middleName, a.lastName].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return `Unnamed athlete (${a.id.slice(0, 6)})`
}

const athletesInCategory = computed(() => {
  if (!form.categoryId) return []
  return athletes.value.filter(
    (a) =>
      Array.isArray(a.categories) &&
      a.categories.some((c: any) => c.id === form.categoryId)
  )
})

const redAthleteOptions = computed(() =>
  athletesInCategory.value.filter((a) => a.id !== form.blueAthleteId)
)
const blueAthleteOptions = computed(() =>
  athletesInCategory.value.filter((a) => a.id !== form.redAthleteId)
)

const selectedRedAthlete = computed(() =>
  athletes.value.find((a) => a.id === form.redAthleteId)
)
const selectedBlueAthlete = computed(() =>
  athletes.value.find((a) => a.id === form.blueAthleteId)
)

watch(
  () => form.categoryId,
  async (newId) => {
    form.tatamiId = ''

    const cat = categories.value.find((c) => c.id === newId)
    if (cat?.tournamentId) {
      await fetchTatami(cat.tournamentId)
    } else {
      tatamis.value = []
    }

    // Auto duration from age group / name
    form.timerSeconds = newId ? timerSecondsForCategory(cat) : undefined

    const validIds = new Set(
      athletes.value
        .filter(
          (a) =>
            Array.isArray(a.categories) &&
            a.categories.some((c: any) => c.id === newId)
        )
        .map((a) => a.id)
    )

    if (form.redAthleteId && !validIds.has(form.redAthleteId)) {
      form.redAthleteId = ''
    }
    if (form.blueAthleteId && !validIds.has(form.blueAthleteId)) {
      form.blueAthleteId = ''
    }
  }
)

function resetForm() {
  editingId.value = null
  form.categoryId = ''
  form.tatamiId = ''
  form.round = ''
  form.redAthleteId = ''
  form.blueAthleteId = ''
  form.status = 'SCHEDULED'
  form.timerSeconds = undefined
  form.scheduledTime = ''
  formError.value = null
  form.refereeId = ''
  form.scorekeeperId = ''
}

function startEdit(m: any) {
  editingId.value = m.id
  form.categoryId = m.category?.id ?? ''
  form.round = m.round ?? ''
  form.redAthleteId = m.redAthlete?.id ?? ''
  form.blueAthleteId = m.blueAthlete?.id ?? ''
  form.status = m.status ?? 'SCHEDULED'
  form.tatamiId = m.tatami?.id ?? ''
  form.timerSeconds =
    m.timerSeconds ?? timerSecondsForCategory(m.category)
  form.scheduledTime = toLocalInputValue(m.scheduledTime)
}

async function submit() {
  formError.value = null
  if (!form.categoryId || !form.round) {
    formError.value = 'Category and round are required.'
    return
  }

  if (
    form.redAthleteId &&
    form.blueAthleteId &&
    form.redAthleteId === form.blueAthleteId
  ) {
    formError.value = 'Red and Blue corner athletes must be different.'
    return
  }

  saving.value = true
  try {
    const payload = {
      categoryId: form.categoryId,
      tatamiId: form.tatamiId || undefined,
      round: form.round,
      redAthleteId: form.redAthleteId || undefined,
      blueAthleteId: form.blueAthleteId || undefined,
      status: form.status,
      timerSeconds: form.timerSeconds,
      // Left blank = auto-schedule after the previous match on this tatami
      scheduledTime: fromLocalInputValue(form.scheduledTime),
      refereeId: form.refereeId || undefined,
      scorekeeperId: form.scorekeeperId || undefined,
    }

    if (editingId.value) {
      await updateMatch(editingId.value, payload)
    } else {
      await createMatch(payload)
    }

    resetForm()
    await fetchAll()
  } catch (err: any) {
    formError.value =
      err?.data?.message || err.message || 'Failed to save match'
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete this match? This cannot be undone.')) return
  await deleteMatch(id)
  await fetchAll()
}

async function handleRegenerate() {
  if (!form.categoryId) {
    alert('Please select a category first.')
    return
  }

  const confirmed = window.confirm(
    'This will delete all matches for the selected category and regenerate them from the bracket.\n\nDo you want to continue?'
  )

  if (!confirmed) return

  try {
    await regenerateBracket(form.categoryId)

    await fetchAll()

    alert('Bracket regenerated successfully.')

    resetForm()
  } catch (err: any) {
    alert(err?.data?.message || err?.message || 'Failed to regenerate bracket.')
  }
}

onMounted(() => {
  fetchAll()
  fetchCategories()
  fetchAthletes()
  fetchReferees()
  fetchScorekeepers()
})
</script>

<template>
  <div class="min-h-screen bg-canvas px-6 py-10 text-foreground">
    <div class="max-w-5xl mx-auto space-y-10">
      <h1 class="text-3xl font-bold text-foreground">Manage Matches</h1>

      <!-- Form -->
      <div class="bg-panel border border-line rounded-2xl p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground">
          {{ editingId ? 'Edit Match' : 'Create Match' }}
        </h2>

        <div
          v-if="formError"
          class="bg-red-950/60 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm"
        >
          {{ formError }}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-foreground/50 block mb-1">Category</label>
            <select
              v-model="form.categoryId"
              class="w-full bg-surface rounded-lg px-3 py-2 text-foreground"
            >
              <option value="">Select category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs text-foreground/50 block mb-1">Tatami</label>
            <select
              v-model="form.tatamiId"
              class="w-full bg-surface rounded-lg px-3 py-2 text-foreground"
              :disabled="!form.categoryId"
            >
              <option value="">Unassigned</option>
              <option v-for="t in tatamis" :key="t.id" :value="t.id">
                Tatami {{ t.number }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs text-foreground/50 block mb-1">Round</label>
            <select
              v-model="form.round"
              class="w-full bg-surface rounded-lg px-3 py-2 text-foreground"
            >
              <option value="">Select round</option>
              <option
                v-for="r in roundOptions"
                :key="r.value"
                :value="r.value"
              >
                {{ r.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="text-xs text-foreground/50 block mb-1">Status</label>
            <select
              v-model="form.status"
              class="w-full bg-surface rounded-lg px-3 py-2 text-foreground"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <!-- Scheduled start time -->
          <div class="col-span-2">
            <label class="text-xs text-foreground/50 block mb-1">
              Scheduled start time
            </label>
            <input
              v-model="form.scheduledTime"
              type="datetime-local"
              class="w-full bg-surface rounded-lg px-3 py-2 text-foreground"
            />
            <p class="text-xs text-foreground/50 mt-1">
              Leave blank to auto-schedule after the previous match on this tatami.
            </p>
          </div>

          <!-- Duration -->
          <div class="col-span-2">
            <label class="text-xs text-foreground/50 block mb-1">
              Match duration (seconds)
            </label>
            <input
              v-model.number="form.timerSeconds"
              type="number"
              min="30"
              max="600"
              step="30"
              class="w-full bg-surface rounded-lg px-3 py-2 text-foreground"
              placeholder="Auto from age group"
            />
            <p v-if="form.categoryId" class="text-xs text-foreground/50 mt-1">
              Suggested (WKF): {{ suggestedTimerSeconds }}s
              <span v-if="selectedCategory">
                — {{ selectedCategory.ageGroup || selectedCategory.name }}
                / {{ selectedCategory.discipline }}
              </span>
            </p>
          </div>

          <!-- Red Corner -->
          <div>
            <label class="text-xs text-foreground/50 block mb-1">
              Red Corner Athlete
            </label>
            <select
              v-model="form.redAthleteId"
              class="w-full bg-surface rounded-lg px-3 py-2 text-foreground border border-red-800/40"
            >
              <option value="">TBD</option>
              <option
                v-for="a in redAthleteOptions"
                :key="a.id"
                :value="a.id"
              >
                {{ athleteName(a) }}
              </option>
            </select>
            <p v-if="selectedRedAthlete" class="text-xs text-red-400 mt-1">
              Selected: {{ athleteName(selectedRedAthlete) }}
            </p>
          </div>

          <!-- Blue Corner -->
          <div>
            <label class="text-xs text-foreground/50 block mb-1">
              Blue Corner Athlete
            </label>
            <select
              v-model="form.blueAthleteId"
              class="w-full bg-surface rounded-lg px-3 py-2 text-foreground border border-blue-800/40"
            >
              <option value="">TBD</option>
              <option
                v-for="a in blueAthleteOptions"
                :key="a.id"
                :value="a.id"
              >
                {{ athleteName(a) }}
              </option>
            </select>
            <p v-if="selectedBlueAthlete" class="text-xs text-blue-400 mt-1">
              Selected: {{ athleteName(selectedBlueAthlete) }}
            </p>
          </div>
          <!-- Referee -->
            <div>
              <label class="text-xs text-foreground/50 block mb-1">Referee</label>
              <select
                v-model="form.refereeId"
                class="w-full bg-surface rounded-lg px-3 py-2 text-foreground"
              >
                <option value="">Unassigned</option>
                <option
                  v-for="r in referees"
                  :key="r.id"
                  :value="r.id"
                >
                  {{ r.firstName }} {{ r.lastName }}
                  <span v-if="r.license"> ({{ r.license }})</span>
                </option>
              </select>
            </div>

            <!-- Scorekeeper -->
            <div>
              <label class="text-xs text-foreground/50 block mb-1">Scorekeeper</label>
              <select
                v-model="form.scorekeeperId"
                class="w-full bg-surface rounded-lg px-3 py-2 text-foreground"
              >
                <option value="">Unassigned</option>
                <option
                  v-for="s in scorekeepers"
                  :key="s.id"
                  :value="s.id"
                >
                  {{ s.name }} ({{ s.email }})
                </option>
              </select>
            </div>
        </div>

        <div class="flex gap-3 pt-2">
          <button
            class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 font-semibold disabled:opacity-40 text-white"
            :disabled="saving"
            @click="submit"
          >
            {{ editingId ? 'Save Changes' : 'Create Match' }}
          </button>
          <button
            class="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white"
            @click="handleRegenerate"
          >
            Clear & Regenerate
          </button>
          <button
            v-if="editingId"
            class="px-5 py-2 rounded-lg bg-surface hover:bg-surface-hover font-semibold"
            @click="resetForm"
          >
            Cancel
          </button>
        </div>
      </div>

      <!-- List -->
      <div>
        <h2 class="text-lg font-semibold mb-4 text-foreground">
          Existing Matches
        </h2>

        <div v-if="matchesPending" class="text-foreground/60">Loading...</div>
        <div v-else-if="matchesError" class="text-red-400">
          {{ matchesError }}
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="m in matches"
            :key="m.id"
            class="flex items-center justify-between bg-panel border border-line rounded-xl px-5 py-3"
          >
            <div>
              <div class="flex items-center gap-2">
                <p class="font-medium text-foreground">
                  {{ m.redAthlete ? athleteName(m.redAthlete) : 'TBD' }}
                  vs
                  {{ m.blueAthlete ? athleteName(m.blueAthlete) : 'TBD' }}
                </p>
                <span
                  v-if="formatScheduledTime(m.scheduledTime)"
                  class="rounded-full bg-blue-600/20 px-2.5 py-0.5 text-xs font-semibold text-blue-400"
                >
                  {{ formatScheduledTime(m.scheduledTime) }}
                </span>
              </div>
              <p class="text-xs text-foreground/50">
                {{ m.category?.name }} •
                {{
                  roundOptions.find((r) => r.value === m.round)?.label ||
                  m.round
                }}
                • {{ m.status }}
                <span v-if="m.timerSeconds"> • {{ m.timerSeconds }}s</span>
              </p>
            </div>

            <div class="flex gap-2">
              <NuxtLink
                :to="`/scoring-control/${m.id}`"
                class="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-sm text-white"
              >
                Score
              </NuxtLink>
              <button
                class="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-hover text-sm"
                @click="startEdit(m)"
              >
                Edit
              </button>
              <button
                class="px-3 py-1.5 rounded-lg bg-red-800 hover:bg-red-700 text-sm text-white"
                @click="handleDelete(m.id)"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>