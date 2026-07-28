<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
definePageMeta({
  layout: 'auth',
})

const { api } = useApi()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

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

  loading.value = true

  try {
    await api('/auth/register', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
      },
    })

    success.value =
      'Registration successful! Your account has been created as a Guest.'

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
  <div class="min-h-screen flex items-center justify-center bg-canvas px-4">
    <div
      class="w-full max-w-md p-8 bg-surface rounded-3xl border border-line"
    >
      <h1 class="text-3xl font-bold text-center mb-2 text-foreground">
        Create Account
      </h1>

      <p class="text-center text-muted mb-8">
        Register as a Guest. You can become an Athlete later.
      </p>

      <form
        @submit.prevent="handleRegister"
        class="space-y-5"
      >
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
            placeholder="Password"
            required
            minlength="6"
            class="w-full bg-panel border border-line rounded-xl px-4 py-3 pr-12 text-foreground"
          />

          <button
            v-if="password.length > 0"
            type="button"
            @mousedown="showPassword = true"
            @mouseup="showPassword = false"
            @mouseleave="showPassword = false"
            @touchstart.prevent="showPassword = true"
            @touchend="showPassword = false"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
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
            v-if="confirmPassword.length > 0"
            type="button"
            @mousedown="showConfirmPassword = true"
            @mouseup="showConfirmPassword = false"
            @mouseleave="showConfirmPassword = false"
            @touchstart.prevent="showConfirmPassword = true"
            @touchend="showConfirmPassword = false"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <Eye class="h-5 w-5" />
          </button>
        </div>

        <p
          v-if="error"
          class="text-red-500 text-sm"
        >
          {{ error }}
        </p>

        <p
          v-if="success"
          class="text-green-500 text-sm"
        >
          {{ success }}
        </p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-medium transition text-white"
        >
          {{ loading ? 'Creating Account...' : 'Register' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-muted">
        Already have an account?

        <NuxtLink
          to="/login"
          class="text-blue-500 hover:underline"
        >
          Login
        </NuxtLink>
      </div>
    </div>
  </div>
</template>