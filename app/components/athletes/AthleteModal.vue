<script setup lang="ts">
import { ref, watch, computed, nextTick,onMounted } from 'vue'
import { X, Save, Loader2, Upload, Trash2 } from 'lucide-vue-next'
import CountryFlag from 'vue-country-flag-next'
import { COUNTRIES, COUNTRY_CODE_MAP } from '~/utils/countries'
interface AthleteForm {
  id?: string
  firstName: string
  middleName?: string
  lastName: string
  gender: 'MALE' | 'FEMALE' | 'MIXED' | ''
  dateOfBirth: string
  bloodGroup?: string
  disability?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state: string
  postalCode?: string
  country: string
  guardianName?: string
  emergencyContact?: string
  emergencyPhone?: string
  style?: string
  currentRank?: string
  federationId?: string
  dojoId?: string
  coachId?: string
  photoUrl?: string | null
  // An athlete can be enrolled in multiple categories — this holds the
  // full set of selected category IDs, submitted as enrollments by
  // whatever page handles the 'save' event.
  categoryIds: string[]
}

const props = defineProps<{
  open: boolean
  loading?: boolean
  athlete?: any | null
  categories: any[]
  dojos?: any[]
  coaches?: any[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', payload: { athlete: AthleteForm; photoFile?: File }): void
}>()

const form = ref<AthleteForm>(getEmptyForm())
const previewUrl = ref<string | null>(null)
const selectedFile = ref<File | null>(null)
const errors = ref<Record<string, string>>({})

// Guards the country->phone-code watcher so it doesn't fire while we're
// programmatically populating the form (e.g. loading an existing athlete),
// which would otherwise stomp on their real saved phone number.
let skipPhoneSync = false

const isEdit = computed(() => !!props.athlete?.id)

const age = computed(() => {
  if (!form.value.dateOfBirth) return null
  const today = new Date()
  const dob = new Date(form.value.dateOfBirth)
  let a = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) a--
  return a
})

const isMinor = computed(() => age.value !== null && age.value < 18)

const karateStyles = [
  { value: 'SHITO_RYU', label: 'Shito-Ryu' },
  { value: 'SHOTO_KAN', label: 'Shotokan' },
  { value: 'GOJU_RYU', label: 'Goju-Ryu' },
  { value: 'WADO_RYU', label: 'Wado-Ryu' },
  { value: 'KYOKUSHIN', label: 'Kyokushin' },
  { value: 'UECHI_RYU', label: 'Uechi-Ryu' },
  { value: 'OTHER', label: 'Other' },
]

const karateRanks = [
  'WHITE', 'YELLOW', 'ORANGE', 'GREEN', 'BLUE', 'PURPLE', 'BROWN',
  'BLACK_1_DAN', 'BLACK_2_DAN', 'BLACK_3_DAN', 'BLACK_4_DAN', 'BLACK_5_DAN',
  'BLACK_6_DAN', 'BLACK_7_DAN', 'BLACK_8_DAN', 'BLACK_9_DAN', 'BLACK_10_DAN',
]

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

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

function getEmptyForm(): AthleteForm {
  return {
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    bloodGroup: '',
    disability: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'IND',
    guardianName: '',
    emergencyContact: '',
    emergencyPhone: '',
    style: '',
    currentRank: '',
    federationId: '',
    dojoId: '',
    coachId: '',
    photoUrl: null,
    categoryIds: [],
  }
}

watch(() => props.open, (value) => {
  if (!value) return

  skipPhoneSync = true

  if (props.athlete) {
    form.value = {
      id: props.athlete.id,
      firstName: props.athlete.firstName || '',
      middleName: props.athlete.middleName || '',
      lastName: props.athlete.lastName || '',
      gender: props.athlete.gender || '',
      dateOfBirth: props.athlete.dateOfBirth
        ? props.athlete.dateOfBirth.substring(0, 10)
        : '',
      bloodGroup: props.athlete.bloodGroup || '',
      disability: props.athlete.disability || '',
      phone: props.athlete.phone || '',
      email: props.athlete.email || '',
      address: props.athlete.address || '',
      city: props.athlete.city || '',
      state: props.athlete.state || '',
      postalCode: props.athlete.postalCode || '',
      country: props.athlete.country || 'IND',
      guardianName: props.athlete.guardianName || '',
      emergencyContact: props.athlete.emergencyContact || '',
      emergencyPhone: props.athlete.emergencyPhone || '',
      style: props.athlete.style || '',
      currentRank: props.athlete.currentRank || '',
      federationId: props.athlete.federationId || '',
      dojoId: props.athlete.dojoId || props.athlete.dojo?.id || '',
      coachId: props.athlete.coachId || props.athlete.coach?.id || '',
      photoUrl: props.athlete.photoUrl || null,
      categoryIds: Array.isArray(props.athlete.categories)
        ? props.athlete.categories.map((c: any) => c.id)
        : [],
    }
    previewUrl.value = props.athlete.photoUrl || null
  } else {
    resetForm()
  }
  errors.value = {}

  nextTick(() => {
    skipPhoneSync = false
  })
}, { immediate: true })

function resetForm() {
  form.value = getEmptyForm()
  previewUrl.value = null
  selectedFile.value = null
  // New athlete forms default to India — make sure the +91 code shows
  // up immediately instead of waiting for the user to touch the
  // country dropdown.
  applyCountryCode(form.value.country)
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
  if (!form.value.gender) {
    errors.value.gender = 'Gender is required'
    valid = false
  }
  if (!form.value.dateOfBirth) {
    errors.value.dateOfBirth = 'Date of birth is required'
    valid = false
  }
  if (!form.value.state.trim()) {
    errors.value.state = 'State is required'
    valid = false
  }

  // Phone: must have at least a few digits beyond the country code
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

  if (!form.value.address?.trim()) {
    errors.value.address = 'Address is required'
    valid = false
  }

  if (!form.value.city?.trim()) {
    errors.value.city = 'City is required'
    valid = false
  }

  if (!form.value.style) {
    errors.value.style = 'Karate style is required'
    valid = false
  }

  if (!form.value.categoryIds.length) {
    errors.value.categoryIds = 'Select at least one category'
    valid = false
  }

  if (isMinor.value && !form.value.guardianName?.trim()) {
    errors.value.guardianName = 'Guardian name is required for minors'
    valid = false
  }

  return valid
}

function submit() {
  if (!validate()) return
  emit('save', {
    athlete: { ...form.value },
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
        <div class="w-full max-w-3xl rounded-3xl border border-line bg-panel shadow-2xl my-8">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-line px-6 py-5 sticky top-0 bg-panel z-10 rounded-t-3xl">
            <div>
              <h2 class="text-xl font-bold text-foreground">
                {{ isEdit ? 'Edit Athlete' : 'Register Athlete' }}
              </h2>
              <p class="mt-1 text-sm text-muted">
                {{ isEdit ? 'Update athlete information' : 'Create a new athlete profile' }}
              </p>
            </div>
            <button @click="emit('close')" class="rounded-lg p-2 hover:bg-surface transition">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 space-y-8 max-h-[70vh] overflow-y-auto">

            <!-- Photo -->
            <div>
              <label class="mb-2 block text-sm font-medium">Profile Photo</label>
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

            <!-- Personal Details -->
            <div>
              <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Personal Details</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">First Name *</label>
                  <input v-model="form.firstName" type="text" class="input" placeholder="Rahul" />
                  <p v-if="errors.firstName" class="mt-1 text-sm text-red-400">{{ errors.firstName }}</p>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Middle Name</label>
                  <input v-model="form.middleName" type="text" class="input" placeholder="Kumar" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Last Name *</label>
                  <input v-model="form.lastName" type="text" class="input" placeholder="Sharma" />
                  <p v-if="errors.lastName" class="mt-1 text-sm text-red-400">{{ errors.lastName }}</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Gender *</label>
                  <select v-model="form.gender" class="input">
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="MIXED">Mixed</option>
                  </select>
                  <p v-if="errors.gender" class="mt-1 text-sm text-red-400">{{ errors.gender }}</p>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Date of Birth *</label>
                  <input v-model="form.dateOfBirth" type="date" class="input" />
                  <p v-if="errors.dateOfBirth" class="mt-1 text-sm text-red-400">{{ errors.dateOfBirth }}</p>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Blood Group</label>
                  <select v-model="form.bloodGroup" class="input">
                    <option value="">Select</option>
                    <option v-for="bg in bloodGroups" :key="bg" :value="bg">{{ bg }}</option>
                  </select>
                </div>
              </div>

              <div class="mt-4">
                <label class="mb-1.5 block text-sm font-medium">Disabilities (if any)</label>
                <input v-model="form.disability" type="text" class="input" placeholder="None / describe if any" />
              </div>
            </div>

            <!-- Contact -->
            <div>
              <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Contact</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Phone *</label>
                  <input v-model="form.phone" type="tel" class="input" placeholder="+91 98765 43210" />
                  <p v-if="errors.phone" class="mt-1 text-sm text-red-400">{{ errors.phone }}</p>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Email *</label>
                  <input v-model="form.email" type="email" class="input" placeholder="athlete@email.com" />
                  <p v-if="errors.email" class="mt-1 text-sm text-red-400">{{ errors.email }}</p>
                </div>
              </div>

              <div class="mt-4">
                <label class="mb-1.5 block text-sm font-medium">Address *</label>
                <input v-model="form.address" type="text" class="input" placeholder="Street address" />
                <p v-if="errors.address" class="mt-1 text-sm text-red-400">{{ errors.address }}</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">City *</label>
                  <input v-model="form.city" type="text" class="input" />
                  <p v-if="errors.city" class="mt-1 text-sm text-red-400">{{ errors.city }}</p>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">State *</label>
                  <input v-model="form.state" type="text" class="input" placeholder="Gujarat" />
                  <p v-if="errors.state" class="mt-1 text-sm text-red-400">{{ errors.state }}</p>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Postal Code</label>
                  <input v-model="form.postalCode" type="text" class="input" />
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
              </div>
            </div>

            <!-- Guardian / Emergency -->
            <div>
              <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-4">
                {{ isMinor ? 'Guardian (Minor)' : 'Emergency Contact' }}
              </h3>

              <div v-if="isMinor" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Guardian Name *</label>
                  <input v-model="form.guardianName" type="text" class="input" />
                  <p v-if="errors.guardianName" class="mt-1 text-sm text-red-400">{{ errors.guardianName }}</p>
                </div>
              </div>

              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Emergency Contact Name</label>
                  <input v-model="form.emergencyContact" type="text" class="input" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Emergency Phone</label>
                  <input v-model="form.emergencyPhone" type="tel" class="input" />
                </div>
              </div>
            </div>

            <!-- Karate Details -->
            <div>
              <h3 class="text-sm font-semibold text-muted uppercase tracking-wider mb-4">Karate Details</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Karate Style *</label>
                  <select v-model="form.style" class="input">
                    <option value="">Select Style</option>
                    <option v-for="s in karateStyles" :key="s.value" :value="s.value">
                      {{ s.label }}
                    </option>
                  </select>
                  <p v-if="errors.style" class="mt-1 text-sm text-red-400">{{ errors.style }}</p>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Current Rank / Credentials</label>
                  <select v-model="form.currentRank" class="input">
                    <option value="">Select Rank</option>
                    <option v-for="r in karateRanks" :key="r" :value="r">
                      {{ r.replaceAll('_', ' ') }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Federation ID</label>
                  <input v-model="form.federationId" type="text" class="input" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium">Categories *</label>
                  <div class="max-h-40 overflow-y-auto rounded-xl border border-line bg-surface p-2 space-y-1">
                    <label
                      v-for="category in categories"
                      :key="category.id"
                      class="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-hover cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        :value="category.id"
                        v-model="form.categoryIds"
                        class="rounded border-line"
                      />
                      <span>{{ category.name }} – {{ category.ageGroup }} – {{ category.gender }} – {{ category.discipline }}</span>
                    </label>
                    <p v-if="!categories?.length" class="px-2 py-1.5 text-sm text-muted">
                      No categories available
                    </p>
                  </div>
                  <p v-if="errors.categoryIds" class="mt-1 text-sm text-red-400">{{ errors.categoryIds }}</p>
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
              {{ isEdit ? 'Update Athlete' : 'Create Athlete' }}
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