<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, Save, Loader2 } from 'lucide-vue-next'

interface Athlete {
  id?: string
  name: string
  state: string
  country: string
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  athlete?: Athlete | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', athlete: Athlete): void
}>()

const form = ref<Athlete>({
  name: '',
  state: '',
  country: 'IND',
})

const errors = ref({
  name: '',
  state: '',
})

const isEdit = computed(() => !!props.athlete)

watch(
  () => props.open,
  (value) => {
    if (!value) return

    if (props.athlete) {
      form.value = {
        id: props.athlete.id,
        name: props.athlete.name,
        state: props.athlete.state,
        country: props.athlete.country || 'IND',
      }
    } else {
      form.value = {
        name: '',
        state: '',
        country: 'IND',
      }
    }

    errors.value = {
      name: '',
      state: '',
    }
  },
  { immediate: true }
)

function validate() {
  errors.value.name = ''
  errors.value.state = ''

  let valid = true

  if (!form.value.name.trim()) {
    errors.value.name = 'Athlete name is required'
    valid = false
  }

  if (!form.value.state.trim()) {
    errors.value.state = 'State is required'
    valid = false
  }

  return valid
}

function submit() {
  if (!validate()) return

  emit('save', {
    ...form.value,
    name: form.value.name.trim(),
    state: form.value.state.trim(),
    country: form.value.country.trim() || 'IND',
  })
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div
          class="w-full max-w-lg rounded-3xl border border-line bg-panel shadow-2xl"
        >
          <!-- Header -->

          <div
            class="flex items-center justify-between border-b border-line px-6 py-5"
          >
            <div>
              <h2 class="text-xl font-bold text-foreground">
                {{ isEdit ? 'Edit Athlete' : 'Register Athlete' }}
              </h2>

              <p class="mt-1 text-sm text-muted">
                {{
                  isEdit
                    ? 'Update athlete information'
                    : 'Create a new athlete'
                }}
              </p>
            </div>

            <button
              class="rounded-lg p-2 hover:bg-surface transition"
              @click="emit('close')"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->

          <div class="space-y-5 p-6">
            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">
                Athlete Name
              </label>

              <input
                v-model="form.name"
                type="text"
                placeholder="Rahul Sharma"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              />

              <p
                v-if="errors.name"
                class="mt-2 text-sm text-red-400"
              >
                {{ errors.name }}
              </p>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">
                State
              </label>

              <input
                v-model="form.state"
                type="text"
                placeholder="Gujarat"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              />

              <p
                v-if="errors.state"
                class="mt-2 text-sm text-red-400"
              >
                {{ errors.state }}
              </p>
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">
                Country
              </label>

              <input
                v-model="form.country"
                type="text"
                placeholder="IND"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              />
            </div>
          </div>

          <!-- Footer -->

          <div
            class="flex items-center justify-end gap-3 border-t border-line px-6 py-5"
          >
            <button
              class="rounded-xl border border-line px-5 py-2 hover:bg-surface transition"
              @click="emit('close')"
            >
              Cancel
            </button>

            <button
              :disabled="loading"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              @click="submit"
            >
              <Loader2
                v-if="loading"
                class="h-4 w-4 animate-spin"
              />

              <Save
                v-else
                class="h-4 w-4"
              />

              {{ isEdit ? 'Update Athlete' : 'Create Athlete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>