<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
const disciplineOptions = [
  'KATA',
  'KUMITE',
  'TEAM_KATA',
  'TEAM_KUMITE',
] as const

function emptyForm(): CategoryPayload {
  return {
    tournamentId: '',
    name: '',
    ageGroup: '',
    minAge: 0,
    maxAge: 0,
    gender: 'MALE',
    discipline: 'KATA',
    weightMin: null,
    weightMax: null,
  }
}

const form = ref<CategoryPayload>(emptyForm())
const errors = ref<Record<string, string>>({})

const showWeightFields = computed(() =>
  form.value.discipline === 'KUMITE' ||
  form.value.discipline === 'TEAM_KUMITE',
)

watch(
  () => [props.open, props.category] as const,
  ([open, category]) => {
    if (!open) return

    form.value = category
      ? {
          tournamentId: category.tournamentId,
          name: category.name,
          ageGroup: category.ageGroup,
          minAge: category.minAge,
          maxAge: category.maxAge,
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

// Clear weights whenever discipline changes to Kata
watch(
  () => form.value.discipline,
  (discipline) => {
    if (
      discipline === 'KATA' ||
      discipline === 'TEAM_KATA'
    ) {
      form.value.weightMin = null
      form.value.weightMax = null
    }
  },
)

function validate() {
  const e: Record<string, string> = {}

  if (!form.value.tournamentId)
    e.tournamentId = 'Tournament is required'

  if (!form.value.name.trim())
    e.name = 'Name is required'

  if (!form.value.ageGroup.trim())
    e.ageGroup = 'Age group is required'

  if (form.value.minAge == null)
    e.minAge = 'Minimum age is required'

  if (form.value.maxAge == null)
    e.maxAge = 'Maximum age is required'

  if (form.value.minAge > form.value.maxAge)
    e.maxAge = 'Maximum age must be greater than minimum age'

  if (
    showWeightFields.value &&
    form.value.weightMin != null &&
    form.value.weightMax != null &&
    Number(form.value.weightMin) > Number(form.value.weightMax)
  ) {
    e.weightMax = 'Maximum weight must be greater than minimum weight'
  }

  errors.value = e
  return Object.keys(e).length === 0
}

function handleSubmit() {
  if (!validate()) return

  const payload: CategoryPayload = {
    ...form.value,
    name: form.value.name.trim(),
    ageGroup: form.value.ageGroup.trim(),
    minAge: Number(form.value.minAge),
    maxAge: Number(form.value.maxAge),

    weightMin: showWeightFields.value
      ? (
          form.value.weightMin == null ||
          Number.isNaN(form.value.weightMin)
            ? null
            : Number(form.value.weightMin)
        )
      : null,

    weightMax: showWeightFields.value
      ? (
          form.value.weightMax == null ||
          Number.isNaN(form.value.weightMax)
            ? null
            : Number(form.value.weightMax)
        )
      : null,
  }

  console.log('Category payload:', payload)

  emit('submit', payload)
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
        <div
          class="w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl"
        >
          <!-- Header -->
          <div class="border-b border-line px-8 py-6">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold text-foreground">
                  {{ isEdit ? 'Edit Category' : 'Add Category' }}
                </h2>

                <p class="mt-1 text-sm text-muted">
                  {{
                    isEdit
                      ? 'Update the category information.'
                      : 'Create a new tournament category.'
                  }}
                </p>
              </div>

              <button
                class="rounded-lg p-2 transition hover:bg-surface-hover"
                :disabled="loading"
                @click="handleClose"
              >
                <X class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Body -->
          <form
            class="max-h-[70vh] overflow-y-auto p-8"
            @submit.prevent="handleSubmit"
          >
            <div class="space-y-8">

              <!-- Basic Information -->
              <div>
                <h3 class="mb-4 border-b border-line pb-2 text-sm font-semibold uppercase tracking-wider text-muted">
                  Basic Information
                </h3>

                <div class="space-y-5">

                  <!-- Tournament -->
                  <div>
                    <label class="mb-2 block text-sm font-medium text-foreground">
                      Tournament
                    </label>

                    <select
                      v-model="form.tournamentId"
                      class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground outline-none transition focus:border-blue-500"
                      :class="{ 'border-red-500': errors.tournamentId }"
                    >
                      <option disabled value="">
                        Select Tournament
                      </option>

                      <option
                        v-for="t in tournaments"
                        :key="t.id"
                        :value="t.id"
                      >
                        {{ t.name }}
                      </option>
                    </select>

                    <p
                      v-if="errors.tournamentId"
                      class="mt-1 text-xs text-red-400"
                    >
                      {{ errors.tournamentId }}
                    </p>
                  </div>

                  <!-- Name -->
                  <div>
                    <label class="mb-2 block text-sm font-medium text-foreground">
                      Category Name
                    </label>

                    <input
                      v-model="form.name"
                      type="text"
                      placeholder="Senior Male Kumite -75kg"
                      class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground outline-none transition focus:border-blue-500"
                      :class="{ 'border-red-500': errors.name }"
                    />

                    <p
                      v-if="errors.name"
                      class="mt-1 text-xs text-red-400"
                    >
                      {{ errors.name }}
                    </p>
                  </div>

                  <!-- Age Group -->
                  <div>
                    <label class="mb-2 block text-sm font-medium text-foreground">
                      Age Group
                    </label>

                    <input
                      v-model="form.ageGroup"
                      type="text"
                      placeholder="U14, U18, Senior..."
                      class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground outline-none transition focus:border-blue-500"
                      :class="{ 'border-red-500': errors.ageGroup }"
                    />

                    <p
                      v-if="errors.ageGroup"
                      class="mt-1 text-xs text-red-400"
                    >
                      {{ errors.ageGroup }}
                    </p>
                  </div>

                  <div class="grid gap-5 md:grid-cols-2">

                    <div>
                      <label class="mb-2 block text-sm font-medium text-foreground">
                        Minimum Age
                      </label>

                      <input
                        v-model.number="form.minAge"
                        type="number"
                        min="0"
                        class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground outline-none transition focus:border-blue-500"
                        :class="{ 'border-red-500': errors.minAge }"
                      >

                      <p
                        v-if="errors.minAge"
                        class="mt-1 text-xs text-red-400"
                      >
                        {{ errors.minAge }}
                      </p>
                    </div>

                    <div>
                      <label class="mb-2 block text-sm font-medium text-foreground">
                        Maximum Age
                      </label>

                      <input
                        v-model.number="form.maxAge"
                        type="number"
                        min="0"
                        class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground outline-none transition focus:border-blue-500"
                        :class="{ 'border-red-500': errors.maxAge }"
                      >

                      <p
                        v-if="errors.maxAge"
                        class="mt-1 text-xs text-red-400"
                      >
                        {{ errors.maxAge }}
                      </p>
                    </div>

                  </div>
                </div>
              </div>

              <!-- Competition -->
              <div>
                <h3 class="mb-4 border-b border-line pb-2 text-sm font-semibold uppercase tracking-wider text-muted">
                  Competition
                </h3>

                <div class="grid gap-5 md:grid-cols-2">

                  <div>
                    <label class="mb-2 block text-sm font-medium text-foreground">
                      Gender
                    </label>

                    <select
                      v-model="form.gender"
                      class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground outline-none transition focus:border-blue-500"
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
                    <label class="mb-2 block text-sm font-medium text-foreground">
                      Discipline
                    </label>

                    <select
                      v-model="form.discipline"
                      class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground outline-none transition focus:border-blue-500"
                    >
                      <option
                        v-for="d in disciplineOptions"
                        :key="d"
                        :value="d"
                      >
                        {{
                          d
                            .replaceAll('_', ' ')
                            .toLowerCase()
                            .replace(/\b\w/g, c => c.toUpperCase())
                        }}
                      </option>
                    </select>
                  </div>

                </div>
              </div>

              <!-- Weight -->
              <div v-if="showWeightFields">
                <h3 class="mb-4 border-b border-line pb-2 text-sm font-semibold uppercase tracking-wider text-muted">
                  Weight Range
                </h3>

                <div class="grid gap-5 md:grid-cols-2">

                  <div>
                    <label class="mb-2 block text-sm font-medium text-foreground">
                      Minimum Weight (kg)
                    </label>

                    <input
                      v-model="form.weightMin"
                      type="number"
                      step="0.1"
                      placeholder="Optional"
                      class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground outline-none transition focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label class="mb-2 block text-sm font-medium text-foreground">
                      Maximum Weight (kg)
                    </label>

                    <input
                      v-model="form.weightMax"
                      type="number"
                      step="0.1"
                      placeholder="Optional"
                      class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground outline-none transition focus:border-blue-500"
                      :class="{ 'border-red-500': errors.weightMax }"
                    />

                    <p
                      v-if="errors.weightMax"
                      class="mt-1 text-xs text-red-400"
                    >
                      {{ errors.weightMax }}
                    </p>
                  </div>

                </div>
              </div>

            </div>

            <!-- Footer -->
            <div class="mt-8 border-t border-line pt-6">
              <div class="flex justify-end gap-3">

                <button
                  type="button"
                  :disabled="loading"
                  @click="handleClose"
                  class="rounded-xl border border-line bg-surface px-5 py-3 font-medium text-foreground transition hover:bg-surface-hover"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  :disabled="loading"
                  class="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
                >
                  {{
                    loading
                      ? 'Saving...'
                      : isEdit
                        ? 'Save Changes'
                        : 'Create Category'
                  }}
                </button>

              </div>
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