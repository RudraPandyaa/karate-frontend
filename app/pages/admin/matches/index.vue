<script setup lang="ts">
definePageMeta({ middleware: 'staff' })
const { matches, pending: matchesPending, error: matchesError, fetchAll, createMatch, updateMatch, deleteMatch } = useMatches()
const { rows: categories, fetchCategories } = useCategories()
const { athletes, fetchAthletes } = useAthletes()
const { rows: tatamis, fetchTatami } = useTatami()

const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref<string | null>(null)

const form = reactive({
  categoryId: '',
  tatamiId: '',
  round: '',
  redAthleteId: '',
  blueAthleteId: '',
  status: 'SCHEDULED',
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

const selectedCategory = computed(() => categories.value.find((c) => c.id === form.categoryId))

// Athlete records don't reliably have `name` or `fullName` populated —
// fall back through the available name fields so the dropdown never
// renders a blank option.
function athleteName(a: any): string {
  if (!a) return ''
  if (a.fullName) return a.fullName
  if (a.name) return a.name
  const parts = [a.firstName, a.middleName, a.lastName].filter(Boolean)
  if (parts.length) return parts.join(' ')
  return `Unnamed athlete (${a.id.slice(0, 6)})`
}

// Only athletes enrolled in the selected category should be selectable —
// picking a category first narrows the pool instead of showing everyone.
const athletesInCategory = computed(() => {
  if (!form.categoryId) return []
  return athletes.value.filter((a) =>
    Array.isArray(a.categories) && a.categories.some((c: any) => c.id === form.categoryId)
  )
})

// Prevent the same athlete being picked for both corners.
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

// Tatami is tournament-scoped — refetch whenever the chosen category's
// tournament changes, since there's no flat GET /tatami endpoint.
watch(() => form.categoryId, async (newId) => {
  form.tatamiId = ''
  const cat = categories.value.find((c) => c.id === newId)
  if (cat?.tournamentId) {
    await fetchTatami(cat.tournamentId)
  } else {
    tatamis.value = []
  }

  // Only clear a selected corner if that athlete isn't actually enrolled
  // in the newly chosen category. Checking membership (rather than a
  // "did the user just change this" flag) means startEdit()'s pre-filled
  // athletes survive this watcher firing, since they're already valid
  // for the match's own category.
  const validIds = new Set(
    athletes.value
      .filter((a) => Array.isArray(a.categories) && a.categories.some((c: any) => c.id === newId))
      .map((a) => a.id)
  )

  if (form.redAthleteId && !validIds.has(form.redAthleteId)) {
    form.redAthleteId = ''
  }
  if (form.blueAthleteId && !validIds.has(form.blueAthleteId)) {
    form.blueAthleteId = ''
  }
})

function resetForm() {
  editingId.value = null
  form.categoryId = ''
  form.tatamiId = ''
  form.round = ''
  form.redAthleteId = ''
  form.blueAthleteId = ''
  form.status = 'SCHEDULED'
  formError.value = null
}

function startEdit(m: any) {
  editingId.value = m.id
  form.categoryId = m.category?.id ?? ''
  form.round = m.round ?? ''
  form.redAthleteId = m.redAthlete?.id ?? ''
  form.blueAthleteId = m.blueAthlete?.id ?? ''
  form.status = m.status ?? 'SCHEDULED'
  form.tatamiId = m.tatami?.id ?? ''
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
    }

    if (editingId.value) {
      await updateMatch(editingId.value, payload)
    } else {
      await createMatch(payload)
    }

    resetForm()
    await fetchAll()
  } catch (err: any) {
    formError.value = err?.data?.message || err.message || 'Failed to save match'
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Delete this match? This cannot be undone.')) return
  await deleteMatch(id)
  await fetchAll()
}

onMounted(() => {
  fetchAll()
  fetchCategories()
  fetchAthletes()
})
</script>

<template>
  <div class="min-h-screen bg-canvas px-6 py-10 text-foreground">
    <div class="max-w-5xl mx-auto space-y-10">
      <h1 class="text-3xl font-bold text-foreground">Manage Matches</h1>

      <!-- Form -->
      <div class="bg-panel border border-line rounded-2xl p-6 space-y-4">
        <h2 class="text-lg font-semibold text-foreground">{{ editingId ? 'Edit Match' : 'Create Match' }}</h2>

        <div v-if="formError" class="bg-red-950/60 border border-red-700 text-red-300 px-4 py-2 rounded-lg text-sm">
          {{ formError }}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-xs text-foreground/50 block mb-1">Category</label>
            <select v-model="form.categoryId" class="w-full bg-surface rounded-lg px-3 py-2 text-foreground">
              <option value="">Select category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-foreground/50 block mb-1">Tatami</label>
            <select v-model="form.tatamiId" class="w-full bg-surface rounded-lg px-3 py-2 text-foreground" :disabled="!form.categoryId">
              <option value="">Unassigned</option>
              <option v-for="t in tatamis" :key="t.id" :value="t.id">Tatami {{ t.number }}</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-foreground/50 block mb-1">Round</label>
            <select v-model="form.round" class="w-full bg-surface rounded-lg px-3 py-2 text-foreground">
              <option value="">Select round</option>
              <option v-for="r in roundOptions" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-foreground/50 block mb-1">Status</label>
            <select v-model="form.status" class="w-full bg-surface rounded-lg px-3 py-2 text-foreground">
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <!-- Red Corner -->
          <div>
            <label class="text-xs text-foreground/50 block mb-1">Red Corner Athlete</label>
            <select v-model="form.redAthleteId" class="w-full bg-surface rounded-lg px-3 py-2 text-foreground border border-red-800/40">
              <option value="">TBD</option>
              <option v-for="a in redAthleteOptions" :key="a.id" :value="a.id">{{ athleteName(a) }}</option>
            </select>
            <p v-if="selectedRedAthlete" class="text-xs text-red-400 mt-1">
              Selected: {{ athleteName(selectedRedAthlete) }}
            </p>
          </div>

          <!-- Blue Corner -->
          <div>
            <label class="text-xs text-foreground/50 block mb-1">Blue Corner Athlete</label>
            <select v-model="form.blueAthleteId" class="w-full bg-surface rounded-lg px-3 py-2 text-foreground border border-blue-800/40">
              <option value="">TBD</option>
              <option v-for="a in blueAthleteOptions" :key="a.id" :value="a.id">{{ athleteName(a) }}</option>
            </select>
            <p v-if="selectedBlueAthlete" class="text-xs text-blue-400 mt-1">
              Selected: {{ athleteName(selectedBlueAthlete) }}
            </p>
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
        <h2 class="text-lg font-semibold mb-4 text-foreground">Existing Matches</h2>

        <div v-if="matchesPending" class="text-foreground/60">Loading...</div>
        <div v-else-if="matchesError" class="text-red-400">{{ matchesError }}</div>

        <div v-else class="space-y-2">
          <div
            v-for="m in matches"
            :key="m.id"
            class="flex items-center justify-between bg-panel border border-line rounded-xl px-5 py-3"
          >
            <div>
              <p class="font-medium text-foreground">
                {{ m.redAthlete ? athleteName(m.redAthlete) : 'TBD' }} vs {{ m.blueAthlete ? athleteName(m.blueAthlete) : 'TBD' }}
              </p>
              <p class="text-xs text-foreground/50">
                {{ m.category?.name }} • {{ roundOptions.find(r => r.value === m.round)?.label || m.round }} • {{ m.status }}
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