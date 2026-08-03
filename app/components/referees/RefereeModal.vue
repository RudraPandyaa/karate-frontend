<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { X, Save, Loader2, Upload, Trash2 } from 'lucide-vue-next'
import CountryFlag from 'vue-country-flag-next'
import { COUNTRIES, COUNTRY_CODE_MAP } from '~/utils/countries'

interface RefereeForm {
  id?: string
  firstName: string
  lastName: string
  country: string
  license?: string
  rank?: string
  certification?: string
  status: string
  phone?: string
  email?: string
  photoUrl?: string | null
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  referee?: any | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { referee: RefereeForm; photoFile?: File }): void
}>()

const form = ref<RefereeForm>(getEmptyForm())
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const errors = ref<Record<string, string>>({})

// Guards the country->phone-code watcher so it doesn't fire while we're
// programmatically populating the form (e.g. loading an existing referee),
// which would otherwise stomp on their real saved phone number.
let skipPhoneSync = false

const isEdit = computed(() => !!props.referee?.id)

const ranks = [
  { value: 'NATIONAL', label: 'National' },
  { value: 'CONTINENTAL', label: 'Continental' },
  { value: 'INTERNATIONAL_B', label: 'International B' },
  { value: 'INTERNATIONAL_A', label: 'International A' },
  { value: 'WKF', label: 'WKF' },
]

const statuses = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
]

/**
 * Replace (or insert) the leading "+xx" calling code on form.phone
 * to match the given country, preserving whatever digits the user
 * already typed.
 */
function applyCountryCode(countryCode: string) {
  const selected = COUNTRIES.find(c => c.code === countryCode)
  if (!selected) return

  const currentPhone = form.value.phone || ''
  const phoneWithoutCode = currentPhone.replace(/^\+\d+\s*/, '').trim()

  form.value.phone = `${selected.phoneCode} ${phoneWithoutCode}`.trim()
}

// Fires on manual country changes made by the user while the modal is
// open (not during programmatic form population — see skipPhoneSync).
watch(() => form.value.country, (newCountry) => {
  if (skipPhoneSync) return
  applyCountryCode(newCountry)
})

function getEmptyForm(): RefereeForm {
  return {
    firstName: '',
    lastName: '',
    country: 'IND',
    license: '',
    rank: '',
    certification: '',
    status: 'ACTIVE',
    phone: '',
    email: '',
    photoUrl: null,
  }
}

watch(() => props.open, (value) => {
  if (!value) return

  skipPhoneSync = true

  if (props.referee) {
    form.value = {
      id: props.referee.id,
      firstName: props.referee.firstName || '',
      lastName: props.referee.lastName || '',
      country: props.referee.country || 'IND',
      license: props.referee.license || '',
      rank: props.referee.rank || '',
      certification: props.referee.certification || '',
      status: props.referee.status || 'ACTIVE',
      phone: props.referee.phone || '',
      email: props.referee.email || '',
      photoUrl: props.referee.photoUrl || null,
    }
    previewUrl.value = props.referee.photoUrl || null
  } else {
    form.value = getEmptyForm()
    previewUrl.value = null
    // New referee forms default to India — make sure the +91 code shows
    // up immediately instead of waiting for the user to touch the
    // country dropdown.
    applyCountryCode(form.value.country)
  }
  selectedFile.value = null
  errors.value = {}

  nextTick(() => {
    skipPhoneSync = false
  })
}, { immediate: true })

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

  const phoneDigits = (form.value.phone || '').replace(/\D/g, '')
  if (!form.value.phone?.trim() || phoneDigits.length < 6) {
    errors.value.phone = 'Phone number is required'
    valid = false
  }

  if (!form.value.email?.trim()) {
    errors.value.email = 'Email is required'
    valid = false
  } else if (!EMAIL_RE.test(form.value.email.trim())) {
    errors.value.email = 'Enter a valid email address'
    valid = false
  }

  return valid
}

function submit() {
  if (!validate()) return
  emit('save', {
    referee: { ...form.value },
    photoFile: selectedFile.value || undefined,
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
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      >
        <div class="w-full max-w-2xl rounded-3xl border border-line bg-panel shadow-2xl my-8">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-line px-6 py-5 sticky top-0 bg-panel z-10 rounded-t-3xl">
            <div>
              <h2 class="text-xl font-bold text-foreground">
                {{ isEdit ? 'Edit Referee' : 'Register Referee' }}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ isEdit ? 'Update referee information' : 'Create a new referee profile' }}
              </p>
            </div>
            <button @click="emit('close')" class="rounded-lg p-2 hover:bg-surface transition">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <!-- Photo -->
            <div>
              <label class="mb-2 block text-sm font-medium">Photo</label>
              <div class="flex items-center gap-4">
                <div class="w-24 h-24 rounded-2xl overflow-hidden border border-line bg-surface shrink-0">
                  <img v-if="previewUrl" :src="previewUrl" class="w-full h-full object-cover" />
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

            <!-- Personal -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium">First Name *</label>
                <input v-model="form.firstName" type="text" class="input" />
                <p v-if="errors.firstName" class="mt-1 text-sm text-red-400">{{ errors.firstName }}</p>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium">Last Name *</label>
                <input v-model="form.lastName" type="text" class="input" />
                <p v-if="errors.lastName" class="mt-1 text-sm text-red-400">{{ errors.lastName }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="mb-1.5 block text-sm font-medium">Phone *</label>
                <input v-model="form.phone" type="tel" class="input" placeholder="+91 98765 43210" />
                <p v-if="errors.phone" class="mt-1 text-sm text-red-400">{{ errors.phone }}</p>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium">Email *</label>
                <input v-model="form.email" type="email" class="input" placeholder="referee@email.com" />
                <p v-if="errors.email" class="mt-1 text-sm text-red-400">{{ errors.email }}</p>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium">Country</label>
              <div class="flex items-center gap-3">
                <CountryFlag :country="COUNTRY_CODE_MAP[form.country]" size="medium" />
                <select v-model="form.country" class="input flex-1">
                  <option v-for="c in COUNTRIES" :key="c.code" :value="c.code">
                    {{ c.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Officiating details -->
            <div>
              <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Officiating Details</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">License No.</label>
                  <input v-model="form.license" type="text" class="input" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Rank</label>
                  <select v-model="form.rank" class="input">
                    <option value="">Select Rank</option>
                    <option v-for="r in ranks" :key="r.value" :value="r.value">{{ r.label }}</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Certification</label>
                  <input v-model="form.certification" type="text" class="input" placeholder="e.g. WKF Kata Judge" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Status</label>
                  <select v-model="form.status" class="input">
                    <option v-for="s in statuses" :key="s.value" :value="s.value">{{ s.label }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-line px-6 py-5 sticky bottom-0 bg-panel rounded-b-3xl">
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
              {{ isEdit ? 'Update Referee' : 'Create Referee' }}
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