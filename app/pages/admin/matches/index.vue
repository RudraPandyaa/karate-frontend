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

const selectedCategory = computed(() => categories.value.find((c) => c.id === form.categoryId))

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
            <input v-model="form.round" placeholder="e.g. Quarter Final" class="w-full bg-surface rounded-lg px-3 py-2 text-foreground" />
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

          <div>
            <label class="text-xs text-foreground/50 block mb-1">Red Corner Athlete</label>
            <select v-model="form.redAthleteId" class="w-full bg-surface rounded-lg px-3 py-2 text-foreground">
              <option value="">TBD</option>
              <option v-for="a in athletes" :key="a.id" :value="a.id">{{ a.name }}</option>
            </select>
          </div>

          <div>
            <label class="text-xs text-foreground/50 block mb-1">Blue Corner Athlete</label>
            <select v-model="form.blueAthleteId" class="w-full bg-surface rounded-lg px-3 py-2 text-foreground">
              <option value="">TBD</option>
              <option v-for="a in athletes" :key="a.id" :value="a.id">{{ a.name }}</option>
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
                {{ m.redAthlete?.name ?? 'TBD' }} vs {{ m.blueAthlete?.name ?? 'TBD' }}
              </p>
              <p class="text-xs text-foreground/50">
                {{ m.category?.name }} • {{ m.round }} • {{ m.status }}
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