<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Match } from '~/types'

const props = defineProps<{
  categories: any[]
  athletes: any[]
  tatamis?: any[]
  matchToEdit?: Match | null   // Optional: for editing existing match
}>()
const { athletes, categories, tatamis } = toRefs(props)
const emit = defineEmits<{
  close: []
  created: []
  updated?: [matchId: string]
}>()

// Form State
const form = ref({
  categoryId: '',
  tatamiId: '',
  round: '',
  status: 'SCHEDULED',
  redAthleteId: '',
  blueAthleteId: '',
})

const safeAthletes = computed(() => 
  Array.isArray(athletes.value) ? athletes.value : []
)

const selectedRedAthlete = computed(() =>
  safeAthletes.value.find(a => a.id === form.value.redAthleteId)
)

const selectedBlueAthlete = computed(() =>
  safeAthletes.value.find(a => a.id === form.value.blueAthleteId)
)

const editingId = ref<string | null>(null)
const saving = ref(false)
const formError = ref('')

// Reset form
const resetForm = () => {
  form.value = {
    categoryId: '',
    tatamiId: '',
    round: '',
    status: 'SCHEDULED',
    redAthleteId: '',
    blueAthleteId: '',
  }
  editingId.value = null
  formError.value = ''
}

// Open for editing
const openEdit = (match: Match) => {
  editingId.value = match.id
  form.value = {
    categoryId: match.categoryId || '',
    tatamiId: match.tatamiId || '',
    round: match.round || '',
    status: match.status || 'SCHEDULED',
    redAthleteId: match.redAthleteId || '',
    blueAthleteId: match.blueAthleteId || '',
  }
}

// Submit
const submit = async () => {
  if (!form.value.categoryId) {
    formError.value = 'Please select a category'
    return
  }

  saving.value = true
  formError.value = ''

  try {
    // TODO: Call your API here (create or update)
    // Example:
    // if (editingId.value) {
    //   await updateMatch(editingId.value, form.value)
    // } else {
    //   await createMatch(form.value)
    // }

    emit(editingId.value ? 'updated' : 'created')
    resetForm()
    emit('close')
  } catch (err: any) {
    formError.value = err.message || 'Something went wrong'
  } finally {
    saving.value = false
  }
}

// Watch for edit mode
watch(() => props.matchToEdit, (match) => {
  if (match) openEdit(match)
}, { immediate: true })

// Expose reset for parent
defineExpose({ resetForm })
</script>

<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
    <div class="bg-panel border border-line rounded-3xl w-full max-w-2xl overflow-hidden">
      <!-- Header -->
      <div class="px-6 py-5 border-b border-line flex items-center justify-between">
        <h2 class="text-xl font-semibold text-foreground">
          {{ editingId ? 'Edit Match' : 'Create New Match' }}
        </h2>
        <button
          @click="$emit('close')"
          class="text-muted hover:text-foreground transition"
        >
          ✕
        </button>
      </div>

      <!-- Form -->
      <div class="p-6 space-y-6">
        <div v-if="formError" class="bg-red-950/60 border border-red-700 text-red-300 px-4 py-3 rounded-xl text-sm">
          {{ formError }}
        </div>

        <div class="grid grid-cols-2 gap-4">
          <!-- Category -->
          <div>
            <label class="text-xs text-foreground/50 block mb-1">Category</label>
            <select
              v-model="form.categoryId"
              class="w-full bg-surface border border-line rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500"
            >
              <option value="">Select category</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">
                {{ c.name }}
              </option>
            </select>
          </div>

          <!-- Tatami -->
          <div>
            <label class="text-xs text-foreground/50 block mb-1">Tatami</label>
            <select
              v-model="form.tatamiId"
              class="w-full bg-surface border border-line rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500"
              :disabled="!form.categoryId"
            >
              <option value="">Unassigned</option>
              <option v-for="t in tatamis" :key="t.id" :value="t.id">
                Tatami {{ t.number }}
              </option>
            </select>
          </div>

          <!-- Round -->
          <div>
            <label class="text-xs text-foreground/50 block mb-1">Round</label>
            <input
              v-model="form.round"
              placeholder="e.g. Quarter Final, Semi Final, Final"
              class="w-full bg-surface border border-line rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500"
            />
          </div>

          <!-- Status -->
          <div>
            <label class="text-xs text-foreground/50 block mb-1">Status</label>
            <select
              v-model="form.status"
              class="w-full bg-surface border border-line rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-blue-500"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <!-- Red Corner -->
            <div>
              <label class="text-xs text-foreground/50 block mb-1">Red Corner Athlete</label>
              <div class="flex gap-3 items-center">
                <div class="w-10 h-10 rounded-xl overflow-hidden border border-line bg-surface flex-shrink-0">
                  <img 
                    v-if="selectedRedAthlete?.photoUrl" 
                    :src="selectedRedAthlete.photoUrl" 
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full bg-gray-700 flex items-center justify-center text-xs">No Photo</div>
                </div>
                <select
                  v-model="form.redAthleteId"
                  class="flex-1 bg-surface border border-line rounded-xl px-4 py-3"
                  @change="updateSelectedRed"
                >
                  <option value="">TBD</option>
                  <option v-for="a in safeAthletes" :key="a.id" :value="a.id">
                    {{ a.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Blue Corner -->
            <div>
              <label class="text-xs text-foreground/50 block mb-1">Blue Corner Athlete</label>
              <div class="flex gap-3 items-center">
                <div class="w-10 h-10 rounded-xl overflow-hidden border border-line bg-surface flex-shrink-0">
                  <img 
                    v-if="selectedBlueAthlete?.photoUrl" 
                    :src="selectedBlueAthlete.photoUrl" 
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full bg-gray-700 flex items-center justify-center text-xs">No Photo</div>
                </div>
                <select
                  v-model="form.blueAthleteId"
                  class="flex-1 bg-surface border border-line rounded-xl px-4 py-3"
                  @change="updateSelectedBlue"
                >
                  <option value="">TBD</option>
                  <option v-for="a in safeAthletes" :key="a.id" :value="a.id">
                    {{ a.name }}
                  </option>
                </select>
              </div>
            </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-5 border-t border-line flex gap-3 justify-end">
        <button
          @click="$emit('close')"
          class="px-6 py-3 rounded-2xl bg-surface hover:bg-surface-hover font-medium transition"
        >
          Cancel
        </button>
        <button
          class="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 font-semibold text-white transition disabled:opacity-50"
          :disabled="saving || !form.categoryId"
          @click="submit"
        >
          {{ saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Match' }}
        </button>
      </div>
    </div>
  </div>
</template>