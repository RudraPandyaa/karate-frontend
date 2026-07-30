<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { X, Save, Loader2 } from 'lucide-vue-next'

interface CoachForm {
  id?: string
  firstName: string
  lastName: string
  phone?: string
  email?: string
  dojoId?: string
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  coach?: any | null
  dojos?: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { coach: CoachForm }): void
}>()

const form = ref<CoachForm>(getEmptyForm())
const errors = ref<Record<string, string>>({})

const isEdit = computed(() => !!props.coach?.id)

function getEmptyForm(): CoachForm {
  return {
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dojoId: '',
  }
}

watch(() => props.open, (value) => {
  if (!value) return

  if (props.coach) {
    form.value = {
      id: props.coach.id,
      firstName: props.coach.firstName || '',
      lastName: props.coach.lastName || '',
      phone: props.coach.phone || '',
      email: props.coach.email || '',
      dojoId: props.coach.dojoId || props.coach.dojo?.id || '',
    }
  } else {
    form.value = getEmptyForm()
  }
  errors.value = {}
}, { immediate: true })

function validate() {
  errors.value = {}
  let valid = true

  if (!form.value.firstName.trim()) {
    errors.value.firstName = 'First name is required'
    valid = false
  }
  if (!form.value.lastName.trim()) {
    errors.value.lastName = 'Last name is required'
    valid = false
  }
  if (form.value.email && !/^\S+@\S+\.\S+$/.test(form.value.email)) {
    errors.value.email = 'Enter a valid email'
    valid = false
  }

  return valid
}

function submit() {
  if (!validate()) return
  emit('save', { coach: { ...form.value } })
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
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      >
        <div class="w-full max-w-lg rounded-3xl border border-line bg-panel shadow-2xl my-8">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-line px-6 py-5">
            <div>
              <h2 class="text-xl font-bold text-foreground">
                {{ isEdit ? 'Edit Coach' : 'Register Coach' }}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ isEdit ? 'Update coach information' : 'Create a new coach profile' }}
              </p>
            </div>
            <button @click="emit('close')" class="rounded-lg p-2 hover:bg-surface transition">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium">First Name *</label>
                <input v-model="form.firstName" type="text" class="input" placeholder="Rahul" />
                <p v-if="errors.firstName" class="mt-1 text-sm text-red-400">{{ errors.firstName }}</p>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium">Last Name *</label>
                <input v-model="form.lastName" type="text" class="input" placeholder="Sharma" />
                <p v-if="errors.lastName" class="mt-1 text-sm text-red-400">{{ errors.lastName }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium">Phone</label>
                <input v-model="form.phone" type="tel" class="input" placeholder="+91 98765 43210" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium">Email</label>
                <input v-model="form.email" type="email" class="input" placeholder="coach@email.com" />
                <p v-if="errors.email" class="mt-1 text-sm text-red-400">{{ errors.email }}</p>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium">Dojo</label>
              <select v-model="form.dojoId" class="input">
                <option value="">Select Dojo</option>
                <option v-for="d in dojos" :key="d.id" :value="d.id">
                  {{ d.name }}
                </option>
              </select>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-line px-6 py-5">
            <button
              class="rounded-xl border border-line px-5 py-2.5 hover:bg-surface transition"
              @click="emit('close')"
            >
              Cancel
            </button>
            <button
              :disabled="loading"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
              @click="submit"
            >
              <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
              <Save v-else class="h-4 w-4" />
              {{ isEdit ? 'Update Coach' : 'Create Coach' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.input {
  @apply w-full rounded-xl border border-line bg-surface px-4 py-2.5 outline-none focus:border-blue-600 text-foreground;
}
</style>