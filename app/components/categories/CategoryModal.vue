<script setup lang="ts">
import { X } from 'lucide-vue-next'

import type {
  Category,
  CategoryPayload,
  TournamentOption,
} from '~/composables/useCategories'

const props = defineProps<{
  open: boolean
  loading: boolean
  category: Category | null
  tournaments: TournamentOption[]
}>()

const emit = defineEmits<{
  close: []
  submit: [payload: CategoryPayload]
}>()

const isEdit = computed(() => !!props.category)

const genderOptions = ['MALE', 'FEMALE', 'MIXED'] as const
const disciplineOptions = ['KATA', 'KUMITE', 'TEAM_KATA', 'TEAM_KUMITE'] as const

function emptyForm(): CategoryPayload {
  return {
    tournamentId: '',
    name: '',
    ageGroup: '',
    gender: 'MALE',
    discipline: 'KATA',
    weightMin: null,
    weightMax: null,
  }
}

const form = ref<CategoryPayload>(emptyForm())
const errors = ref<Record<string, string>>({})

watch(
  () => [props.open, props.category] as const,
  ([open, category]) => {
    if (!open) return

    form.value = category
      ? {
          tournamentId: category.tournamentId,
          name: category.name,
          ageGroup: category.ageGroup,
          gender: category.gender,
          discipline: category.discipline,
          weightMin: category.weightMin,
          weightMax: category.weightMax,
        }
      : emptyForm()

    errors.value = {}
  },
  { immediate: true },
)

function validate() {
  const e: Record<string, string> = {}

  if (!form.value.tournamentId) e.tournamentId = 'Tournament is required'
  if (!form.value.name.trim()) e.name = 'Name is required'
  if (!form.value.ageGroup.trim()) e.ageGroup = 'Age group is required'

  if (
    form.value.weightMin != null &&
    form.value.weightMax != null &&
    form.value.weightMin > form.value.weightMax
  ) {
    e.weightMax = 'Max weight must be greater than min weight'
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function handleSubmit() {
  if (!validate()) return

  emit('submit', {
    ...form.value,
    name: form.value.name.trim(),
    ageGroup: form.value.ageGroup.trim(),
    weightMin: form.value.weightMin === null || form.value.weightMin === undefined
      ? null
      : Number(form.value.weightMin),
    weightMax: form.value.weightMax === null || form.value.weightMax === undefined
      ? null
      : Number(form.value.weightMax),
  })
}

function handleClose() {
  if (props.loading) return
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="handleClose"
      >
        <div class="w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-xl">

          <!-- Header -->

          <div class="mb-6 flex items-center justify-between">
            <h2 class="text-xl font-semibold text-white">
              {{ isEdit ? 'Edit Category' : 'Add Category' }}
            </h2>

            <button
              class="rounded-lg p-1.5 text-muted transition hover:bg-white/10 hover:text-white"
              :disabled="loading"
              @click="handleClose"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Form -->

          <form class="space-y-4" @submit.prevent="handleSubmit">

            <div>
              <label class="mb-1.5 block text-sm font-medium text-white">
                Tournament
              </label>

              <select
                v-model="form.tournamentId"
                class="w-full rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-600"
                :class="{ 'border-red-500': errors.tournamentId }"
              >
                <option value="" disabled>Select a tournament</option>
                <option
                  v-for="t in tournaments"
                  :key="t.id"
                  :value="t.id"
                >
                  {{ t.name }}
                </option>
              </select>

              <p v-if="errors.tournamentId" class="mt-1 text-xs text-red-400">
                {{ errors.tournamentId }}
              </p>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-white">
                Name
              </label>

              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. Senior Male Kumite -75kg"
                class="w-full rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-600"
                :class="{ 'border-red-500': errors.name }"
              />

              <p v-if="errors.name" class="mt-1 text-xs text-red-400">
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-white">
                Age Group
              </label>

              <input
                v-model="form.ageGroup"
                type="text"
                placeholder="e.g. Senior, U21, U18..."
                class="w-full rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-600"
                :class="{ 'border-red-500': errors.ageGroup }"
              />

              <p v-if="errors.ageGroup" class="mt-1 text-xs text-red-400">
                {{ errors.ageGroup }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-white">
                  Gender
                </label>

                <select
                  v-model="form.gender"
                  class="w-full rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-600"
                >
                  <option
                    v-for="g in genderOptions"
                    :key="g"
                    :value="g"
                  >
                    {{ g.charAt(0) + g.slice(1).toLowerCase() }}
                  </option>
                </select>
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-white">
                  Discipline
                </label>

                <select
                  v-model="form.discipline"
                  class="w-full rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-600"
                >
                  <option
                    v-for="d in disciplineOptions"
                    :key="d"
                    :value="d"
                  >
                    {{ d.replace('_', ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) }}
                  </option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium text-white">
                  Min Weight (kg)
                </label>

                <input
                  v-model.number="form.weightMin"
                  type="number"
                  step="0.1"
                  placeholder="Optional"
                  class="w-full rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-600"
                />
              </div>

              <div>
                <label class="mb-1.5 block text-sm font-medium text-white">
                  Max Weight (kg)
                </label>

                <input
                  v-model.number="form.weightMax"
                  type="number"
                  step="0.1"
                  placeholder="Optional"
                  class="w-full rounded-xl border border-line bg-transparent px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-600"
                  :class="{ 'border-red-500': errors.weightMax }"
                />

                <p v-if="errors.weightMax" class="mt-1 text-xs text-red-400">
                  {{ errors.weightMax }}
                </p>
              </div>
            </div>

            <!-- Actions -->

            <div class="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                class="btn btn-secondary"
                :disabled="loading"
                @click="handleClose"
              >
                Cancel
              </button>

              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading"
              >
                {{ loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Category' }}
              </button>
            </div>

          </form>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>