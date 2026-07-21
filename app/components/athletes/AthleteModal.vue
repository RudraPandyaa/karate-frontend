<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, Save, Loader2, Upload, Trash2 } from 'lucide-vue-next'
import type { Category } from '~/composables/useCategories'

interface Athlete {
  id?: string
  name: string
  state: string
  country: string
  photoUrl?: string | null
  categoryId?: string
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  athlete?: Athlete | null
  categories: Category[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (
    e: 'save',
    payload: {
      athlete: Athlete
      photoFile?: File
    }
  ): void
}>()

const form = ref<Athlete>({
  name: '',
  state: '',
  country: 'IND',
  categoryId: '',
  photoUrl: null,
})

const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const errors = ref({ name: '', state: '' })

const isEdit = computed(() => !!props.athlete)

// Watch for modal open
watch(() => props.open, (value) => {
  if (!value) return

  if (props.athlete) {
    form.value = {
      id: props.athlete.id,
      name: props.athlete.name,
      state: props.athlete.state,
      country: props.athlete.country || 'IND',
      categoryId: props.athlete.categoryId || '',
      photoUrl: props.athlete.photoUrl || null,
    }
    previewUrl.value = props.athlete.photoUrl || null
  } else {
    resetForm()
  }
  errors.value = { name: '', state: '' }
}, { immediate: true })

function resetForm() {
  form.value = { name: '', state: '', country: 'IND',  categoryId: '', photoUrl: null }
  previewUrl.value = null
  selectedFile.value = null
}

function onFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file')
    return
  }

  selectedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
}

function removePhoto() {
  previewUrl.value = null
  selectedFile.value = null
  form.value.photoUrl = null
}

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
    athlete: form.value,
    photoFile: selectedFile.value || undefined
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
      <div v-if="open" class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="w-full max-w-lg rounded-3xl border border-line bg-panel shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 class="text-xl font-bold text-foreground">
                {{ isEdit ? 'Edit Athlete' : 'Register Athlete' }}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ isEdit ? 'Update athlete information' : 'Create a new athlete' }}
              </p>
            </div>
            <button @click="emit('close')" class="rounded-lg p-2 hover:bg-surface transition">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="space-y-6 p-6">
            <!-- Photo Upload -->
            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">Profile Photo</label>
              <div class="flex items-center gap-4">
                <div class="w-24 h-24 rounded-2xl overflow-hidden border border-line bg-surface">
                  <img
                    v-if="previewUrl"
                    :src="previewUrl"
                    class="w-full h-full object-cover"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-muted">
                    <Upload class="w-8 h-8" />
                  </div>
                </div>

                <div class="space-y-2">
                  <label class="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-surface px-5 py-2.5 hover:bg-surface-hover transition">
                    <Upload class="w-4 h-4" />
                    <span class="text-sm">Choose Photo</span>
                    <input type="file" accept="image/*" class="hidden" @change="onFileSelect" />
                  </label>

                  <button
                    v-if="previewUrl"
                    @click="removePhoto"
                    class="text-red-400 hover:text-red-500 text-sm flex items-center gap-1"
                  >
                    <Trash2 class="w-4 h-4" /> Remove
                  </button>
                </div>
              </div>
            </div>

            <!-- Name -->
            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">Athlete Name</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="Rahul Sharma"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              />
              <p v-if="errors.name" class="mt-2 text-sm text-red-400">{{ errors.name }}</p>
            </div>

            <!-- State -->
            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">State</label>
              <input
                v-model="form.state"
                type="text"
                placeholder="Gujarat"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              />
              <p v-if="errors.state" class="mt-2 text-sm text-red-400">{{ errors.state }}</p>
            </div>

            <!-- Country -->
            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">Country</label>
              <input
                v-model="form.country"
                type="text"
                placeholder="IND"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              />
            </div>
            <!-- Category -->
            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">
                Category
              </label>

              <select
                v-model="form.categoryId"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              >
                <option value="">
                  Select Category
                </option>

                <option
                  v-for="category in categories"
                  :key="category.id"
                  :value="category.id"
                >
                  {{ category.name }}
                  -
                  {{ category.ageGroup }}
                  -
                  {{ category.gender }}
                  -
                  {{ category.discipline }}
                </option>
              </select>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-line px-6 py-5">
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
              <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
              <Save v-else class="h-4 w-4" />
              {{ isEdit ? 'Update Athlete' : 'Create Athlete' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>