<script setup lang="ts">
import { COUNTRIES, getCountry, getFlagUrl } from '~/utils/countries'
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'athlete',
  middleware: ['athlete'],
})

const { api } = useApi()
const { user } = useAuth()
const { dashboard, pending, fetchDashboard } = useAthleteDashboard()

const saving = ref(false)
const error = ref('')
const success = ref('')

const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const photoInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
  firstName: '',
  lastName: '',
  middleName: '',
  gender: '' as '' | 'MALE' | 'FEMALE',
  dateOfBirth: '',
  country: 'IND',
  state: '',
  phone: '',
  city: '',
  address: '',
  postalCode: '',
  bloodGroup: '',
  disability: '',
  emergencyContact: '',
  emergencyPhone: '',
  style: '',
  currentRank: '',
  federationId: '',
  guardianName: '',
  championshipHistory: '',
})

const athleteId = computed(
  () => dashboard.value?.athlete?.id || user.value?.athlete?.id || '',
)

const flagUrl = computed(() => getFlagUrl(form.country))
const phoneCode = computed(
  () => getCountry(form.country)?.phoneCode || '+91',
)

function toDateInput(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function fillFromAthlete(a: any) {
  if (!a) return
  form.firstName = a.firstName || ''
  form.lastName = a.lastName || ''
  form.middleName = a.middleName || ''
  form.gender = a.gender || ''
  form.dateOfBirth = toDateInput(a.dateOfBirth)
  form.country = a.country || 'IND'
  form.state = a.state || ''
  // strip country code from phone for input if stored as +91...
  form.phone = (a.phone || '').replace(/\D/g, '').slice(-10)
  form.city = a.city || ''
  form.address = a.address || ''
  form.postalCode = a.postalCode || ''
  form.bloodGroup = a.bloodGroup || ''
  form.disability = a.disability || ''
  form.emergencyContact = a.emergencyContact || ''
  form.emergencyPhone = a.emergencyPhone || ''
  form.style = a.style || ''
  form.currentRank = a.currentRank || ''
  form.federationId = a.federationId || ''
  form.guardianName = a.guardianName || ''
  form.championshipHistory = a.championshipHistory || ''
  photoPreview.value = a.photoUrl || null
}

function onPhoneInput(e: Event) {
  form.phone = (e.target as HTMLInputElement).value
    .replace(/\D/g, '')
    .slice(0, 10)
}

function onPhotoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Photo must be under 5 MB.'
    return
  }
  if (photoPreview.value && photoFile.value) {
    URL.revokeObjectURL(photoPreview.value)
  }
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

onMounted(async () => {
  await fetchDashboard()
  fillFromAthlete(dashboard.value?.athlete)
})

watch(
  () => dashboard.value?.athlete,
  (a) => {
    if (a && !form.firstName) fillFromAthlete(a)
  },
)

async function handleSave() {
  error.value = ''
  success.value = ''

  if (!form.firstName.trim() || !form.lastName.trim()) {
    error.value = 'First and last name are required.'
    return
  }
  if (!form.gender) {
    error.value = 'Gender is required.'
    return
  }
  if (!form.state.trim()) {
    error.value = 'State is required.'
    return
  }
  if (form.phone && form.phone.length !== 10) {
    error.value = 'Phone must be 10 digits.'
    return
  }
  if (!athleteId.value) {
    error.value = 'Athlete profile not found.'
    return
  }

  saving.value = true
  try {
    const payload: Record<string, unknown> = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim() || null,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth || null,
      country: form.country || 'IND',
      state: form.state.trim(),
      phone: form.phone
        ? `${phoneCode.value}${form.phone}`
        : null,
      city: form.city.trim() || null,
      address: form.address.trim() || null,
      postalCode: form.postalCode.trim() || null,
      bloodGroup: form.bloodGroup || null,
      disability: form.disability.trim() || null,
      emergencyContact: form.emergencyContact.trim() || null,
      emergencyPhone: form.emergencyPhone.trim() || null,
      style: form.style || null,
      currentRank: form.currentRank || null,
      federationId: form.federationId.trim() || null,
      guardianName: form.guardianName.trim() || null,
      championshipHistory: form.championshipHistory.trim() || null,
    }

    await api(`/athletes/${athleteId.value}`, {
      method: 'PATCH',
      body: payload,
    })

    if (photoFile.value) {
      const fd = new FormData()
      fd.append('photo', photoFile.value)
      const base = useRuntimeConfig().public.apiBase
      const token = useCookie('accessToken').value
      await $fetch(`${base}/athletes/upload-photo/${athleteId.value}`, {
        method: 'POST',
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    }

    success.value = 'Profile updated.'
    await fetchDashboard()
    setTimeout(() => navigateTo('/athletes/profile'), 800)
  } catch (err: any) {
    error.value =
      err?.data?.message || err?.message || 'Failed to save profile.'
  } finally {
    saving.value = false
  }
}
</script>
<template>
  <div class="mx-auto max-w-3xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
    <div>
      <NuxtLink
        to="/athletes/profile"
        class="text-sm text-muted hover:text-foreground"
      >
        ← Back to profile
      </NuxtLink>
      <h1 class="mt-1 text-2xl font-bold text-foreground">
        Edit profile
      </h1>
      <p class="mt-1 text-sm text-muted">
        Complete your athlete details
      </p>
    </div>

    <PageLoader
      v-if="pending"
      text="Loading profile..."
    />

    <form
      v-else
      class="space-y-6"
      @submit.prevent="handleSave"
    >
      <!-- Photo -->
      <section class="rounded-3xl border border-line bg-surface p-6">
        <h2 class="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Photo
        </h2>
        <div class="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-blue-600 text-2xl font-bold text-white">
            <img
              v-if="photoPreview"
              :src="photoPreview"
              alt="Preview"
              class="h-full w-full object-cover"
            />
            <span v-else>
              {{ (form.firstName || 'A').charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="space-y-2">
            <button
              type="button"
              class="rounded-xl border border-line px-4 py-2 text-sm hover:bg-surface-hover"
              @click="photoInputRef?.click()"
            >
              {{ photoPreview ? 'Change photo' : 'Upload photo' }}
            </button>
            <p class="text-xs text-muted">JPG/PNG, max 5 MB</p>
            <input
              ref="photoInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onPhotoChange"
            />
          </div>
        </div>
      </section>

      <!-- Identity -->
      <section class="rounded-3xl border border-line bg-surface p-6 space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
          Identity
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs text-muted">First name *</label>
            <input
              v-model="form.firstName"
              required
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">Last name *</label>
            <input
              v-model="form.lastName"
              required
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs text-muted">Middle name</label>
            <input
              v-model="form.middleName"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
        </div>
      </section>

      <!-- Personal -->
      <section class="rounded-3xl border border-line bg-surface p-6 space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
          Personal
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs text-muted">Gender *</label>
            <select
              v-model="form.gender"
              required
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">Date of birth</label>
            <input
              v-model="form.dateOfBirth"
              type="date"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">Country</label>
            <div class="flex h-[50px] items-center gap-2 rounded-xl border border-line bg-canvas px-3">
              <img
                v-if="flagUrl"
                :src="flagUrl"
                class="h-[18px] w-6 rounded-sm object-cover"
                alt=""
              />
              <select
                v-model="form.country"
                class="h-full w-full bg-transparent text-foreground outline-none"
              >
                <option
                  v-for="c in COUNTRIES"
                  :key="c.code"
                  :value="c.code"
                >
                  {{ c.name }}
                </option>
              </select>
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">State *</label>
            <input
              v-model="form.state"
              required
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
        </div>
      </section>

      <!-- Contact -->
      <section class="rounded-3xl border border-line bg-surface p-6 space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
          Contact
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs text-muted">Phone</label>
            <div class="flex overflow-hidden rounded-xl border border-line bg-canvas">
              <span class="flex items-center border-r border-line px-3 text-sm text-muted">
                {{ phoneCode }}
              </span>
              <input
                :value="form.phone"
                type="tel"
                inputmode="numeric"
                maxlength="10"
                placeholder="10-digit number"
                class="w-full bg-transparent px-4 py-3 text-foreground outline-none"
                @input="onPhoneInput"
              />
            </div>
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">City</label>
            <input
              v-model="form.city"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">Postal code</label>
            <input
              v-model="form.postalCode"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs text-muted">Address</label>
            <textarea
              v-model="form.address"
              rows="2"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
        </div>
      </section>

      <!-- Karate -->
      <section class="rounded-3xl border border-line bg-surface p-6 space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
          Karate
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs text-muted">Style</label>
            <select
              v-model="form.style"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            >
              <option value="">—</option>
              <option value="SHOTOKAN">Shotokan</option>
              <option value="GOJU_RYU">Goju-Ryu</option>
              <option value="WADO_RYU">Wado-Ryu</option>
              <option value="SHITO_RYU">Shito-Ryu</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">Current rank</label>
            <input
              v-model="form.currentRank"
              placeholder="e.g. BLACK_1 or Kyu grade"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs text-muted">Federation ID</label>
            <input
              v-model="form.federationId"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
        </div>
        <p class="text-xs text-muted">
          Style/rank options must match your Prisma enums — adjust values if needed.
        </p>
      </section>

      <!-- Safety -->
      <section class="rounded-3xl border border-line bg-surface p-6 space-y-4">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
          Medical & emergency
        </h2>
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-xs text-muted">Blood group</label>
            <select
              v-model="form.bloodGroup"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            >
              <option value="">—</option>
              <option
                v-for="bg in ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']"
                :key="bg"
                :value="bg"
              >
                {{ bg }}
              </option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">Disability (if any)</label>
            <input
              v-model="form.disability"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">Emergency contact</label>
            <input
              v-model="form.emergencyContact"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">Emergency phone</label>
            <input
              v-model="form.emergencyPhone"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs text-muted">Guardian name</label>
            <input
              v-model="form.guardianName"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
          <div class="sm:col-span-2">
            <label class="mb-1 block text-xs text-muted">Championship history</label>
            <textarea
              v-model="form.championshipHistory"
              rows="3"
              class="w-full rounded-xl border border-line bg-canvas px-4 py-3 text-foreground"
            />
          </div>
        </div>
      </section>

      <div
        v-if="error"
        class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400"
      >
        {{ error }}
      </div>
      <div
        v-if="success"
        class="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400"
      >
        {{ success }}
      </div>

      <div class="flex gap-3">
        <NuxtLink
          to="/athletes/profile"
          class="rounded-xl border border-line px-5 py-3 text-sm hover:bg-surface-hover"
        >
          Cancel
        </NuxtLink>
        <button
          type="submit"
          :disabled="saving"
          class="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {{ saving ? 'Saving...' : 'Save changes' }}
        </button>
      </div>
    </form>
  </div>
</template>