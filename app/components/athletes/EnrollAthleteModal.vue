<script setup lang="ts">
import { X, UserPlus, Loader2 } from 'lucide-vue-next'
import type { TournamentOption, Category } from '~/composables/useCategories'
import type { EnrollPayload } from '~/composables/useAthletes'

const props = defineProps<{
  open: boolean
  loading?: boolean
  tournaments: TournamentOption[]
  categories: Category[]
  /** Category IDs this athlete is already enrolled in */
  enrolledCategoryIds?: string[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: EnrollPayload): void
}>()

const selectedTournamentId = ref('')
const selectedCategoryId = ref('')
const seed = ref<number | null>(null)

const enrolledSet = computed(
  () => new Set(props.enrolledCategoryIds ?? []),
)

/** Categories for selected tournament, excluding already enrolled */
const availableCategories = computed(() =>
  props.categories.filter(
    (c) =>
      c.tournamentId === selectedTournamentId.value &&
      !enrolledSet.value.has(c.id),
  ),
)

const noCategoriesLeft = computed(
  () =>
    !!selectedTournamentId.value &&
    availableCategories.value.length === 0,
)

watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedTournamentId.value = ''
      selectedCategoryId.value = ''
      seed.value = null
    }
  },
)

watch(selectedTournamentId, () => {
  selectedCategoryId.value = ''
})

function handleSubmit() {
  if (!selectedCategoryId.value) return
  if (enrolledSet.value.has(selectedCategoryId.value)) return

  emit('submit', {
    categoryId: selectedCategoryId.value,
    seed: seed.value ?? undefined,
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <div class="w-full max-w-md rounded-3xl border border-line bg-panel shadow-2xl overflow-hidden">

          <!-- Header -->
          <div class="flex items-center justify-between border-b border-line px-6 py-5">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15">
                <UserPlus class="h-6 w-6 text-blue-400" />
              </div>

              <div>
                <h2 class="text-lg font-bold text-foreground">
                  Enroll Athlete
                </h2>
                <p class="text-sm text-muted">
                  Choose a tournament and category
                </p>
              </div>
            </div>

            <button
              class="rounded-lg p-2 hover:bg-surface transition"
              @click="emit('close')"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <form
            class="space-y-4 px-6 py-6"
            @submit.prevent="handleSubmit"
          >

            <div>
              <label class="mb-1 block text-sm font-medium text-muted">
                Tournament
              </label>

              <select
                v-model="selectedTournamentId"
                required
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition focus:border-blue-600 text-foreground"
              >
                <option
                  value=""
                  disabled
                >
                  Select a tournament
                </option>
                <option
                  v-for="t in tournaments"
                  :key="t.id"
                  :value="t.id"
                >
                  {{ t.name }}
                </option>
              </select>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-muted">
                Category
              </label>

              <select
                v-model="selectedCategoryId"
                required
                :disabled="!selectedTournamentId || noCategoriesLeft"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition focus:border-blue-600 disabled:opacity-50 text-foreground"
              >
                <option value="" disabled>
                  {{
                    !selectedTournamentId
                      ? 'Pick a tournament first'
                      : noCategoriesLeft
                        ? 'Already enrolled in all categories'
                        : 'Select a category'
                  }}
                </option>
                <option
                  v-for="c in availableCategories"
                  :key="c.id"
                  :value="c.id"
                >
                  {{ c.name }}
                </option>
              </select>

              <p
                v-if="noCategoriesLeft"
                class="mt-2 text-xs text-amber-400"
              >
                This athlete is already enrolled in every category of this tournament.
              </p>
            </div>

            <div>
              <label class="mb-1 block text-sm font-medium text-muted">
                Seed <span class="text-xs">(optional)</span>
              </label>

              <input
                v-model.number="seed"
                type="number"
                min="1"
                placeholder="Seeding number"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm outline-none transition focus:border-blue-600 text-foreground"
              />
            </div>

            <div class="flex justify-end gap-3 pt-2">
              <button
                type="button"
                class="rounded-xl border border-line px-5 py-2 hover:bg-surface transition"
                @click="emit('close')"
              >
                Cancel
              </button>

              <button
                type="submit"
                :disabled="loading || !selectedCategoryId"
                class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Loader2
                  v-if="loading"
                  class="h-4 w-4 animate-spin"
                />
                Enroll
              </button>
            </div>

          </form>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>