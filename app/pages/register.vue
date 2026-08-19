<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import {
  COUNTRIES,
  getCountry,
  getFlagUrl,
} from '~/utils/countries'

definePageMeta({
  layout: 'auth',
})

const { api } = useApi()

/* Account */
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const registerAsAthlete = ref(false)

/* Athlete */
const firstName = ref('')
const lastName = ref('')
const dateOfBirth = ref('')
const gender = ref('')
const country = ref('IND')
const state = ref('')
const phone = ref('')

/* UI */
const loading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

/* Photo */
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const photoInputRef = ref<HTMLInputElement | null>(null)

function onPhotoChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'Photo must be under 5 MB.'
    return
  }

  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
  error.value = ''
}

function clearPhoto() {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = null
  photoPreview.value = null
  if (photoInputRef.value) photoInputRef.value.value = ''
}

onUnmounted(() => {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
})

/* Country / phone */
const selectedCountry = computed(() => getCountry(country.value))
const phoneCode = computed(() => selectedCountry.value?.phoneCode || '+91')
const flagUrl = computed(() => getFlagUrl(country.value))

function onPhoneInput(event: Event) {
  const input = event.target as HTMLInputElement
  phone.value = input.value.replace(/\D/g, '').slice(0, 10)
}

/* Mode */
function selectGuest() {
  registerAsAthlete.value = false
  error.value = ''
  success.value = ''
  clearPhoto()
}

function selectAthlete() {
  registerAsAthlete.value = true
  error.value = ''
  success.value = ''
}

/* Register */
async function handleRegister() {
  error.value = ''
  success.value = ''

  if (password.value.length < 6) {
    error.value = 'Password must be at least 6 characters.'
    return
  }
  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  if (registerAsAthlete.value) {
    if (!firstName.value.trim() || !lastName.value.trim()) {
      error.value = 'First name and last name are required.'
      return
    }
    if (!gender.value) {
      error.value = 'Gender is required for athletes.'
      return
    }
    if (!state.value.trim()) {
      error.value = 'State is required for athletes.'
      return
    }
    if (phone.value && phone.value.length !== 10) {
      error.value = 'Phone number must be exactly 10 digits.'
      return
    }
  } else if (!name.value.trim()) {
    error.value = 'Name is required.'
    return
  }

  loading.value = true

  try {
    const body: any = {
      email: email.value.trim(),
      password: password.value,
    }

    if (registerAsAthlete.value) {
      const fn = firstName.value.trim()
      const ln = lastName.value.trim()
      body.name = `${fn} ${ln}`.trim()
      body.role = 'ATHLETE'
      body.firstName = fn
      body.lastName = ln
      body.dateOfBirth = dateOfBirth.value || undefined
      body.gender = gender.value
      body.country = country.value || 'IND'
      body.state = state.value.trim()
      body.phone = phone.value
        ? `${phoneCode.value}${phone.value}`
        : undefined
    } else {
      body.name = name.value.trim()
    }

    const res = await api<{
      accessToken: string
      user: { athlete?: { id: string } | null }
    }>('/auth/register', {
      method: 'POST',
      body,
    })

    const athleteId = res?.user?.athlete?.id

    if (
      registerAsAthlete.value &&
      photoFile.value &&
      athleteId &&
      res.accessToken
    ) {
      try {
        const fd = new FormData()
        fd.append('photo', photoFile.value) // backend FileInterceptor('photo')

        const base = useRuntimeConfig().public.apiBase
        await $fetch(`${base}/athletes/upload-photo/${athleteId}`, {
          method: 'POST',
          body: fd,
          headers: {
            Authorization: `Bearer ${res.accessToken}`,
          },
        })
      } catch (photoErr) {
        console.error('Photo upload failed:', photoErr)
        success.value =
          'Account created, but photo upload failed. You can add it from profile later.'
        password.value = ''
        confirmPassword.value = ''
        setTimeout(() => navigateTo('/login'), 2000)
        return
      }
    }

    success.value = registerAsAthlete.value
      ? 'Athlete account created successfully!'
      : 'Account created successfully!'

    password.value = ''
    confirmPassword.value = ''
    clearPhoto()

    setTimeout(() => navigateTo('/login'), 1500)
  } catch (err: any) {
    console.error('Registration error:', err)
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to register. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="rounded-3xl border border-white/10 bg-slate-950/75 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
  >
    <div class="mb-7 text-center">
      <h1 class="text-3xl font-bold tracking-tight text-white">
        Create Account
      </h1>
      <p class="mt-2 text-sm text-white/55">
        Register as a Guest or directly as an Athlete
      </p>
    </div>

    <form
      class="space-y-5"
      @submit.prevent="handleRegister"
    >
      <!-- Account type -->
      <div class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="rounded-xl border px-4 py-3 text-sm font-semibold transition"
          :class="
            !registerAsAthlete
              ? 'border-blue-400/70 bg-blue-500/15 text-blue-300 shadow-lg shadow-blue-900/10'
              : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
          "
          @click="selectGuest"
        >
          Guest
        </button>
        <button
          type="button"
          class="rounded-xl border px-4 py-3 text-sm font-semibold transition"
          :class="
            registerAsAthlete
              ? 'border-red-400/70 bg-red-500/15 text-red-300 shadow-lg shadow-red-900/10'
              : 'border-white/10 bg-white/[0.04] text-white/55 hover:border-white/20 hover:bg-white/[0.07] hover:text-white'
          "
          @click="selectAthlete"
        >
          Athlete
        </button>
      </div>

      <!-- Guest: single name -->
      <div v-if="!registerAsAthlete">
        <label class="mb-2 block text-xs font-medium text-white/70">
          Name
        </label>
        <input
          v-model="name"
          type="text"
          placeholder="Enter your name"
          autocomplete="name"
          required
          class="auth-dark-input"
        />
      </div>

      <!-- Athlete block -->
      <div
        v-if="registerAsAthlete"
        class="space-y-5 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
      >
        <div>
          <h3 class="text-sm font-semibold text-white">
            Athlete Details
          </h3>
          <p class="mt-1 text-xs text-white/45">
            Required for competition registration
          </p>
        </div>

        <!-- Photo -->
        <div class="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div
            class="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/[0.06]"
          >
            <img
              v-if="photoPreview"
              :src="photoPreview"
              alt="Preview"
              class="h-full w-full object-cover"
            />
            <span
              v-else
              class="text-2xl font-bold text-white/30"
            >
              {{ (firstName || '?').charAt(0).toUpperCase() }}
            </span>
          </div>
          <div class="flex flex-1 flex-col gap-2">
            <p class="text-xs text-white/65">
              Profile photo (optional)
            </p>
            <div class="flex flex-wrap gap-2">
              <button
                type="button"
                class="rounded-lg border border-white/15 bg-white/[0.06] px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                @click="photoInputRef?.click()"
              >
                {{ photoPreview ? 'Change photo' : 'Upload photo' }}
              </button>
              <button
                v-if="photoPreview"
                type="button"
                class="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/50 hover:text-red-300"
                @click="clearPhoto"
              >
                Remove
              </button>
            </div>
            <p class="text-[11px] text-white/35">
              JPG/PNG, max 5 MB
            </p>
            <input
              ref="photoInputRef"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onPhotoChange"
            />
          </div>
        </div>

        <!-- First / Last -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs text-white/65">
              First Name *
            </label>
            <input
              v-model="firstName"
              type="text"
              placeholder="First name"
              required
              class="auth-dark-input"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs text-white/65">
              Last Name *
            </label>
            <input
              v-model="lastName"
              type="text"
              placeholder="Last name"
              required
              class="auth-dark-input"
            />
          </div>
        </div>

        <!-- DOB + Gender -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-2 block text-xs text-white/65">
              Date of Birth
            </label>
            <input
              v-model="dateOfBirth"
              type="date"
              class="auth-dark-input"
            />
          </div>
          <div>
            <label class="mb-2 block text-xs text-white/65">
              Gender *
            </label>
            <select
              v-model="gender"
              required
              class="auth-dark-input"
            >
              <option value="">
                Select Gender
              </option>
              <option value="MALE">
                Male
              </option>
              <option value="FEMALE">
                Female
              </option>
            </select>
          </div>
        </div>

        <!-- Country -->
        <div>
          <label class="mb-2 block text-xs text-white/65">
            Country
          </label>
          <div
            class="flex h-[50px] items-center gap-3 rounded-xl border border-white/15 bg-white/[0.06] px-4 transition focus-within:border-blue-400/70"
          >
            <img
              v-if="flagUrl"
              :src="flagUrl"
              alt="flag"
              class="h-[18px] w-6 shrink-0 rounded-sm object-cover"
            />
            <select
              v-model="country"
              class="h-full w-full cursor-pointer bg-transparent text-sm text-white outline-none"
            >
              <option
                v-for="c in COUNTRIES"
                :key="c.code"
                :value="c.code"
                class="bg-slate-900 text-white"
              >
                {{ c.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- State -->
        <div>
          <label class="mb-2 block text-xs text-white/65">
            State *
          </label>
          <input
            v-model="state"
            type="text"
            placeholder="Enter state"
            required
            class="auth-dark-input"
          />
        </div>

        <!-- Phone -->
        <div>
          <label class="mb-2 block text-xs text-white/65">
            Phone
          </label>
          <div
            class="flex h-[50px] overflow-hidden rounded-xl border border-white/15 bg-white/[0.06] transition focus-within:border-blue-400/70"
          >
            <div class="flex shrink-0 items-center border-r border-white/10 px-4">
              <span class="text-sm font-medium text-white/80">
                {{ phoneCode }}
              </span>
            </div>
            <input
              :value="phone"
              type="tel"
              inputmode="numeric"
              maxlength="10"
              placeholder="10-digit number"
              class="w-full bg-transparent px-4 text-sm text-white outline-none placeholder:text-white/35"
              @input="onPhoneInput"
            />
          </div>
          <p class="mt-1.5 text-xs text-white/40">
            Optional. Country code follows country.
          </p>
        </div>
      </div>

      <!-- Email -->
      <div>
        <label class="mb-2 block text-xs font-medium text-white/70">
          Email
        </label>
        <input
          v-model="email"
          type="email"
          placeholder="Enter your email"
          autocomplete="email"
          required
          class="auth-dark-input"
        />
      </div>

      <!-- Password -->
      <div>
        <label class="mb-2 block text-xs font-medium text-white/70">
          Password
        </label>
        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password (minimum 6 characters)"
            autocomplete="new-password"
            minlength="6"
            required
            class="auth-dark-input pr-12"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white"
            @click="showPassword = !showPassword"
          >
            <EyeOff
              v-if="showPassword"
              class="h-5 w-5"
            />
            <Eye
              v-else
              class="h-5 w-5"
            />
          </button>
        </div>
      </div>

      <!-- Confirm -->
      <div>
        <label class="mb-2 block text-xs font-medium text-white/70">
          Confirm Password
        </label>
        <div class="relative">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Confirm your password"
            autocomplete="new-password"
            required
            class="auth-dark-input pr-12"
          />
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white"
            @click="showConfirmPassword = !showConfirmPassword"
          >
            <EyeOff
              v-if="showConfirmPassword"
              class="h-5 w-5"
            />
            <Eye
              v-else
              class="h-5 w-5"
            />
          </button>
        </div>
      </div>

      <div
        v-if="error"
        class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      >
        {{ error }}
      </div>
      <div
        v-if="success"
        class="rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-300"
      >
        {{ success }}
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ loading ? 'Creating Account...' : 'Register' }}
      </button>
    </form>

    <div class="mt-6 text-center text-sm text-white/50">
      Already have an account?
      <NuxtLink
        to="/login"
        class="ml-1 font-semibold text-blue-400 transition hover:text-blue-300 hover:underline"
      >
        Login
      </NuxtLink>
    </div>
  </div>
</template>