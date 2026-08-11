<script setup lang="ts">
import { Eye } from 'lucide-vue-next'

definePageMeta({
  layout: 'auth',
})

const { api } = useApi()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const registerAsAthlete = ref(false)

// Athlete fields
const firstName = ref('')
const lastName = ref('')
const middleName = ref('')
const dateOfBirth = ref('')
const gender = ref('')
const country = ref('IND')
const state = ref('')

const loading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Passwords do not match.'
    return
  }

  if (registerAsAthlete.value) {
    if (!firstName.value.trim() || !lastName.value.trim()) {
      error.value = 'First name and Last name are required for athletes.'
      return
    }
    if (!state.value.trim()) {
      error.value = 'State is required for athletes.'
      return
    }
  }

  loading.value = true

  try {
    const body: any = {
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    }

    if (registerAsAthlete.value) {
      body.role = 'ATHLETE'
      body.firstName = firstName.value.trim()
      body.lastName = lastName.value.trim()
      body.middleName = middleName.value.trim() || undefined
      body.dateOfBirth = dateOfBirth.value || undefined
      body.gender = gender.value || undefined
      body.country = country.value || 'IND'
      body.state = state.value.trim()
    }

    await api('/auth/register', {
      method: 'POST',
      body,
    })

    success.value = registerAsAthlete.value
      ? 'Athlete account created successfully! Redirecting to login...'
      : 'Account created successfully! Redirecting to login...'

    setTimeout(() => {
      navigateTo('/login')
    }, 1500)
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to register.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-canvas px-4 py-10">
    <div class="w-full max-w-lg p-8 bg-surface rounded-3xl border border-line">
      <h1 class="text-3xl font-bold text-center mb-2 text-foreground">
        Create Account
      </h1>
      <p class="text-center text-muted mb-8">
        Register as a Guest or directly as an Athlete
      </p>

      <form @submit.prevent="handleRegister" class="space-y-5">
        <!-- Account Type -->
        <div class="grid grid-cols-2 gap-3">
          <button
            type="button"
            class="rounded-xl border px-4 py-3 text-sm font-medium transition"
            :class="!registerAsAthlete
              ? 'border-blue-500 bg-blue-600/10 text-blue-400'
              : 'border-line bg-panel text-muted hover:bg-surface-hover'"
            @click="registerAsAthlete = false"
          >
            Guest
          </button>

          <button
            type="button"
            class="rounded-xl border px-4 py-3 text-sm font-medium transition"
            :class="registerAsAthlete
              ? 'border-blue-500 bg-blue-600/10 text-blue-400'
              : 'border-line bg-panel text-muted hover:bg-surface-hover'"
            @click="registerAsAthlete = true"
          >
            Athlete
          </button>
        </div>

        <!-- Basic fields -->
        <input
          v-model="name"
          type="text"
          placeholder="Full Name"
          required
          class="w-full bg-panel border border-line rounded-xl px-4 py-3 text-foreground"
        />

        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
          class="w-full bg-panel border border-line rounded-xl px-4 py-3 text-foreground"
        />

        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="Password (min 6 characters)"
            required
            minlength="6"
            class="w-full bg-panel border border-line rounded-xl px-4 py-3 pr-12 text-foreground"
          />
          <button
            v-if="password"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            @mousedown="showPassword = true"
            @mouseup="showPassword = false"
            @mouseleave="showPassword = false"
            @touchstart.prevent="showPassword = true"
            @touchend="showPassword = false"
          >
            <Eye class="h-5 w-5" />
          </button>
        </div>

        <div class="relative">
          <input
            v-model="confirmPassword"
            :type="showConfirmPassword ? 'text' : 'password'"
            placeholder="Confirm Password"
            required
            class="w-full bg-panel border border-line rounded-xl px-4 py-3 pr-12 text-foreground"
          />
          <button
            v-if="confirmPassword"
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            @mousedown="showConfirmPassword = true"
            @mouseup="showConfirmPassword = false"
            @mouseleave="showConfirmPassword = false"
            @touchstart.prevent="showConfirmPassword = true"
            @touchend="showConfirmPassword = false"
          >
            <Eye class="h-5 w-5" />
          </button>
        </div>

        <!-- Athlete extra fields -->
        <div
          v-if="registerAsAthlete"
          class="space-y-4 rounded-2xl border border-line bg-panel/50 p-4"
        >
          <p class="text-sm font-medium text-foreground">
            Athlete Details
          </p>

          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="firstName"
              type="text"
              placeholder="First Name *"
              required
              class="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground"
            />
            <input
              v-model="lastName"
              type="text"
              placeholder="Last Name *"
              required
              class="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground"
            />
          </div>

          <input
            v-model="middleName"
            type="text"
            placeholder="Middle Name (optional)"
            class="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground"
          />

          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="dateOfBirth"
              type="date"
              class="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground"
            />

            <select
              v-model="gender"
              class="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground"
            >
              <option value="">Gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <input
              v-model="country"
              type="text"
              placeholder="Country"
              class="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground"
            />
            <input
              v-model="state"
              type="text"
              placeholder="State *"
              required
              class="w-full bg-canvas border border-line rounded-xl px-4 py-3 text-foreground"
            />
          </div>
        </div>

        <p v-if="error" class="text-red-500 text-sm">
          {{ error }}
        </p>
        <p v-if="success" class="text-green-500 text-sm">
          {{ success }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-medium transition text-white disabled:opacity-60"
        >
          {{ loading ? 'Creating Account...' : 'Register' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-muted">
        Already have an account?
        <NuxtLink to="/login" class="text-blue-500 hover:underline">
          Login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>