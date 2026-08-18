<script setup lang="ts">
import { Plus, Search, Loader2, X } from 'lucide-vue-next'
import PageLoader from '~/components/ui/PageLoader.vue'

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
const regenerating = ref(false)
const formError = ref<string | null>(null)
const showForm = ref(false)

const search = ref('')
const statusFilter = ref('ALL')
const categoryFilter = ref('')
const tatamiFilter = ref('ALL')

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
  categories.value.find((c) => c.id === form.categoryId),
)

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
  } else if (minAge != null && minAge >= 18) {
    band = minAge >= 21 ? 'SENIOR' : 'U21'
  } else {
    if (/U\s*8|U\s*10|KIDS|CHILDREN|PEEWEE/.test(age)) band = 'U10'
    else if (/U\s*12|U\s*14/.test(age)) band = 'U14'
    else if (/U\s*16|CADET/.test(age)) band = 'CADET'
    else if (/U\s*18|JUNIOR/.test(age)) band = 'JUNIOR'
    else if (/U\s*21|UNDER\s*21/.test(age)) band = 'U21'
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

const suggestedTimerSeconds = computed(() =>
  timerSecondsForCategory(selectedCategory.value),
)

function toLocalInputValue(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function fromLocalInputValue(value?: string): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

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
  if (!a) return 'TBD'
  if (a.fullName) return a.fullName
  if (a.name) return a.name
  const parts = [a.firstName, a.middleName, a.lastName].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return `Athlete (${a.id?.slice(0, 6) || '?'})`
}

const athletesInCategory = computed(() => {
  if (!form.categoryId) return []
  return athletes.value.filter(
    (a) =>
      Array.isArray(a.categories) &&
      a.categories.some((c: any) => c.id === form.categoryId),
  )
})

const redAthleteOptions = computed(() =>
  athletesInCategory.value.filter((a) => a.id !== form.blueAthleteId),
)
const blueAthleteOptions = computed(() =>
  athletesInCategory.value.filter((a) => a.id !== form.redAthleteId),
)

const activeReferees = computed(() =>
  referees.value.filter((r) => (r.status || 'ACTIVE') === 'ACTIVE'),
)

/** Dropdown options: ACTIVE only; if editing and current is inactive, still show them once */
const refereeOptions = computed(() => {
  const list = [...activeReferees.value]
  if (form.refereeId) {
    const current = referees.value.find((r) => r.id === form.refereeId)
    if (
      current &&
      (current.status || 'ACTIVE') !== 'ACTIVE' &&
      !list.some((r) => r.id === current.id)
    ) {
      list.unshift(current)
    }
  }
  return list
})

const selectedRefereeInactive = computed(() => {
  if (!form.refereeId) return false
  const r = referees.value.find((x) => x.id === form.refereeId)
  return !!r && (r.status || 'ACTIVE') !== 'ACTIVE'
})

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
    form.tatamiId = cat?.tatamiId || cat?.tatami?.id || ''
    form.timerSeconds = newId ? timerSecondsForCategory(cat) : undefined

    const validIds = new Set(
      athletes.value
        .filter(
          (a) =>
            Array.isArray(a.categories) &&
            a.categories.some((c: any) => c.id === newId),
        )
        .map((a) => a.id),
    )
    if (form.redAthleteId && !validIds.has(form.redAthleteId)) form.redAthleteId = ''
    if (form.blueAthleteId && !validIds.has(form.blueAthleteId)) form.blueAthleteId = ''
  },
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
  form.refereeId = ''
  form.scorekeeperId = ''
  formError.value = null
}

function openCreate() {
  resetForm()
  showForm.value = true
}

function startEdit(m: any) {
  editingId.value = m.id
  form.categoryId = m.category?.id ?? ''
  form.round = m.round ?? ''
  form.redAthleteId = m.redAthlete?.id ?? ''
  form.blueAthleteId = m.blueAthlete?.id ?? ''
  form.status = m.status ?? 'SCHEDULED'
  form.tatamiId = m.tatami?.id ?? ''
  form.timerSeconds = m.timerSeconds ?? timerSecondsForCategory(m.category)
  form.scheduledTime = toLocalInputValue(m.scheduledTime)
  form.refereeId = m.referee?.id ?? m.refereeId ?? ''
  form.scorekeeperId = m.scorekeeper?.id ?? m.scorekeeperId ?? ''
  formError.value = null
  showForm.value = true

  const cat = categories.value.find((c) => c.id === form.categoryId)
  if (cat?.tournamentId) fetchTatami(cat.tournamentId)
}

function closeForm() {
  showForm.value = false
  resetForm()
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

  // ✅ inside submit, before API call
  if (form.refereeId) {
    const r = referees.value.find((x) => x.id === form.refereeId)
    if (r && (r.status || 'ACTIVE') !== 'ACTIVE') {
      formError.value =
        'Only ACTIVE referees can be assigned. Choose another referee.'
      return
    }
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
      scheduledTime: fromLocalInputValue(form.scheduledTime),
      refereeId: form.refereeId || undefined,
      scorekeeperId: form.scorekeeperId || undefined,
    }

    if (editingId.value) {
      await updateMatch(editingId.value, payload)
    } else {
      await createMatch(payload)
    }

    closeForm()
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
    alert('Open New Match and select a category first, or pick category in filters and use regenerate from modal.')
    return
  }
  if (
    !confirm(
      'This will delete all matches for the selected category and regenerate the bracket. Continue?',
    )
  ) {
    return
  }

  regenerating.value = true
  try {
    await regenerateBracket(form.categoryId)
    await fetchAll()
    closeForm()
  } catch (err: any) {
    alert(err?.data?.message || err?.message || 'Failed to regenerate bracket.')
  } finally {
    regenerating.value = false
  }
}

const filteredMatches = computed(() => {
  let list = [...matches.value]

  if (statusFilter.value === 'LIVE') {
    list = list.filter((m) =>
      ['IN_PROGRESS', 'PAUSED'].includes(m.status),
    )
  } else if (statusFilter.value !== 'ALL') {
    list = list.filter((m) => m.status === statusFilter.value)
  }

  if (categoryFilter.value) {
    list = list.filter((m) => m.category?.id === categoryFilter.value)
  }

  if (tatamiFilter.value === 'unassigned') {
    list = list.filter((m) => !m.tatami)
  } else if (tatamiFilter.value !== 'ALL') {
    list = list.filter(
      (m) => String(m.tatami?.number) === tatamiFilter.value,
    )
  }

  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter((m) => {
      const red = athleteName(m.redAthlete)
      const blue = athleteName(m.blueAthlete)
      const cat = m.category?.name || ''
      return (
        red.toLowerCase().includes(q) ||
        blue.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      )
    })
  }

  return list
})

const tatamiOptions = computed(() => {
  const set = new Set<number>()
  for (const m of matches.value) {
    if (m.tatami?.number != null) set.add(m.tatami.number)
  }
  return Array.from(set).sort((a, b) => a - b)
})

function statusClass(s: string) {
  if (s === 'IN_PROGRESS') return 'bg-green-500/15 text-green-400'
  if (s === 'PAUSED') return 'bg-yellow-500/15 text-yellow-400'
  if (s === 'COMPLETED') return 'bg-zinc-500/15 text-zinc-300'
  return 'bg-blue-500/15 text-blue-400'
}

function roundLabel(value?: string) {
  return roundOptions.find((r) => r.value === value)?.label || value || '—'
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
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold text-foreground">Matches</h1>
        <p class="mt-1 text-sm text-muted">
          Schedule bouts, assign officials, open scoring
        </p>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
        @click="openCreate"
      >
        <Plus class="h-4 w-4" />
        New Match
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="relative min-w-[200px] max-w-sm flex-1">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          v-model="search"
          type="text"
          placeholder="Search athletes, categories..."
          class="w-full rounded-xl border border-line bg-surface py-2.5 pl-10 pr-3 text-sm text-foreground outline-none focus:border-blue-500"
        >
      </div>
      <select
        v-model="statusFilter"
        class="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-foreground"
      >
        <option value="ALL">All statuses</option>
        <option value="LIVE">Live / Paused</option>
        <option value="SCHEDULED">Scheduled</option>
        <option value="COMPLETED">Completed</option>
      </select>
      <select
        v-model="categoryFilter"
        class="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-foreground"
      >
        <option value="">All categories</option>
        <option
          v-for="c in categories"
          :key="c.id"
          :value="c.id"
        >
          {{ c.name }}
        </option>
      </select>
      <select
        v-model="tatamiFilter"
        class="rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-foreground"
      >
        <option value="ALL">All tatamis</option>
        <option
          v-for="n in tatamiOptions"
          :key="n"
          :value="String(n)"
        >
          Tatami {{ n }}
        </option>
        <option value="unassigned">Unassigned</option>
      </select>
    </div>

    <PageLoader
      v-if="matchesPending && !matches.length"
      text="Loading matches..."
    />

    <div
      v-else-if="matchesError"
      class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
    >
      {{ matchesError }}
    </div>

    <div
      v-else-if="filteredMatches.length === 0"
      class="rounded-2xl border border-dashed border-line bg-surface py-16 text-center"
    >
      <p class="text-lg font-medium text-foreground">No matches found</p>
      <p class="mt-2 text-sm text-muted">Create a match or change filters.</p>
      <button
        type="button"
        class="mt-6 rounded-xl bg-blue-600 px-5 py-2.5 text-sm text-white hover:bg-blue-700"
        @click="openCreate"
      >
        New Match
      </button>
    </div>

    <!-- List -->
    <div
      v-else
      class="space-y-2"
    >
      <div
        v-for="m in filteredMatches"
        :key="m.id"
        class="flex flex-col gap-3 rounded-2xl border border-line bg-surface px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <p class="font-medium text-foreground">
              <span class="text-red-400">{{ athleteName(m.redAthlete) }}</span>
              <span class="mx-1 text-muted">vs</span>
              <span class="text-blue-400">{{ athleteName(m.blueAthlete) }}</span>
            </p>
            <span
              class="rounded-full px-2.5 py-0.5 text-xs font-bold"
              :class="statusClass(m.status)"
            >
              {{ m.status }}
            </span>
            <span
              v-if="formatScheduledTime(m.scheduledTime)"
              class="rounded-full bg-blue-600/15 px-2.5 py-0.5 text-xs font-semibold text-blue-400"
            >
              {{ formatScheduledTime(m.scheduledTime) }}
            </span>
          </div>
          <p class="mt-1 text-xs text-muted">
            {{ m.category?.name || '—' }}
            · {{ roundLabel(m.round) }}
            · {{ m.tatami ? `Tatami ${m.tatami.number}` : 'No tatami' }}
            <span v-if="m.timerSeconds"> · {{ m.timerSeconds }}s</span>
          </p>
          <p class="mt-1 text-xs text-muted">
            Ref:
            {{
              m.referee
                ? [m.referee.firstName, m.referee.lastName].filter(Boolean).join(' ')
                : '—'
            }}
            · SK: {{ m.scorekeeper?.name || '—' }}
          </p>
        </div>

        <div class="flex shrink-0 flex-wrap gap-2">
          <NuxtLink
            :to="`/scoring-control/${m.id}`"
            class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Score
          </NuxtLink>
          <button
            type="button"
            class="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm hover:bg-surface-hover"
            @click="startEdit(m)"
          >
            Edit
          </button>
          <button
            type="button"
            class="rounded-lg bg-red-800 px-3 py-1.5 text-sm text-white hover:bg-red-700"
            @click="handleDelete(m.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit modal -->
    <Teleport to="body">
      <div
        v-if="showForm"
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
        @click.self="closeForm"
      >
        <div class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
          <div class="flex items-center justify-between border-b border-line px-6 py-4">
            <h2 class="text-lg font-bold text-foreground">
              {{ editingId ? 'Edit Match' : 'New Match' }}
            </h2>
            <button
              type="button"
              class="rounded-lg p-2 text-muted hover:bg-surface hover:text-foreground"
              @click="closeForm"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="space-y-4 overflow-y-auto p-6">
            <div
              v-if="formError"
              class="rounded-xl border border-red-700/50 bg-red-950/40 px-4 py-2 text-sm text-red-300"
            >
              {{ formError }}
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="mb-1 block text-xs text-muted">Category</label>
                <select
                  v-model="form.categoryId"
                  class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-foreground"
                >
                  <option value="">Select category</option>
                  <option
                    v-for="c in categories"
                    :key="c.id"
                    :value="c.id"
                  >
                    {{ c.name }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-1 block text-xs text-muted">Tatami</label>
                <select
                  v-model="form.tatamiId"
                  class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-foreground"
                  :disabled="!form.categoryId"
                >
                  <option value="">Unassigned</option>
                  <option
                    v-for="t in tatamis"
                    :key="t.id"
                    :value="t.id"
                  >
                    Tatami {{ t.number }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-1 block text-xs text-muted">Round</label>
                <select
                  v-model="form.round"
                  class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-foreground"
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
                <label class="mb-1 block text-xs text-muted">Status</label>
                <select
                  v-model="form.status"
                  class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-foreground"
                >
                  <option value="SCHEDULED">Scheduled</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="PAUSED">Paused</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1 block text-xs text-muted">Scheduled start time</label>
                <input
                  v-model="form.scheduledTime"
                  type="datetime-local"
                  class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-foreground"
                >
              </div>

              <div class="sm:col-span-2">
                <label class="mb-1 block text-xs text-muted">Duration (seconds)</label>
                <input
                  v-model.number="form.timerSeconds"
                  type="number"
                  min="30"
                  max="600"
                  step="30"
                  class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-foreground"
                >
                <p
                  v-if="form.categoryId"
                  class="mt-1 text-xs text-muted"
                >
                  Suggested: {{ suggestedTimerSeconds }}s
                </p>
              </div>

              <div>
                <label class="mb-1 block text-xs text-muted">Red (AKA)</label>
                <select
                  v-model="form.redAthleteId"
                  class="w-full rounded-lg border border-red-800/40 bg-surface px-3 py-2 text-foreground"
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
              </div>

              <div>
                <label class="mb-1 block text-xs text-muted">Blue (AO)</label>
                <select
                  v-model="form.blueAthleteId"
                  class="w-full rounded-lg border border-blue-800/40 bg-surface px-3 py-2 text-foreground"
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
              </div>

              <div>
                <label class="mb-1 block text-xs text-muted">Referee</label>
                <select
                  v-model="form.refereeId"
                  class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-foreground"
                >
                  <option value="">Unassigned</option>
                  <option
                    v-for="r in refereeOptions"
                    :key="r.id"
                    :value="r.id"
                  >
                    {{ r.firstName }} {{ r.lastName }}
                    <template v-if="(r.status || 'ACTIVE') !== 'ACTIVE'">
                      ({{ r.status }})
                    </template>
                  </option>
                </select>
                <p
                  v-if="selectedRefereeInactive"
                  class="mt-1 text-xs text-amber-400"
                >
                  This referee is not ACTIVE. Pick an active referee before saving.
                </p>
              </div>

              <div>
                <label class="mb-1 block text-xs text-muted">Scorekeeper</label>
                <select
                  v-model="form.scorekeeperId"
                  class="w-full rounded-lg border border-line bg-surface px-3 py-2 text-foreground"
                >
                  <option value="">Unassigned</option>
                  <option
                    v-for="s in scorekeepers"
                    :key="s.id"
                    :value="s.id"
                  >
                    {{ s.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-3 border-t border-line px-6 py-4">
            <button
              type="button"
              class="inline-flex items-center gap-2 rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
              :disabled="!form.categoryId || regenerating"
              @click="handleRegenerate"
            >
              <Loader2
                v-if="regenerating"
                class="h-4 w-4 animate-spin"
              />
              Clear & Regenerate
            </button>

            <div class="flex gap-2">
              <button
                type="button"
                class="rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface"
                @click="closeForm"
              >
                Cancel
              </button>
              <button
                type="button"
                class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
                :disabled="saving"
                @click="submit"
              >
                <Loader2
                  v-if="saving"
                  class="h-4 w-4 animate-spin"
                />
                {{ editingId ? 'Save Changes' : 'Create Match' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>