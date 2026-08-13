<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { getHomeRouteForRole } from '~/composables/useAuth'

definePageMeta({
  layout: 'auth',
})

const { login, user } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  error.value = ''

  if (!email.value.trim()) {
    error.value = 'Please enter your email.'
    return
  }

  if (!password.value) {
    error.value = 'Please enter your password.'
    return
  }

  loading.value = true

  try {
    const success = await login(
      email.value.trim(),
      password.value
    )

    if (!success) {
      error.value = 'Invalid email or password.'
      return
    }

    const role = user.value?.role

    const target = getHomeRouteForRole(role)

    await navigateTo(target, {
      replace: true,
    })
  } catch (err: any) {
    console.error('Login error:', err)

    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to login. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    class="rounded-3xl border border-white/10 bg-slate-950/75 p-7 shadow-2xl backdrop-blur-xl sm:p-8"
  >

    <!-- Header -->
    <div class="mb-8 text-center">
      <h1
        class="text-3xl font-bold tracking-tight text-white"
      >
        Login
      </h1>

      <p class="mt-2 text-sm text-white/55">
        Sign in to your WKF Manager account
      </p>
    </div>

    <form
      class="space-y-5"
      @submit.prevent="handleLogin"
    >

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
          class="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:bg-white/[0.09] focus:ring-2 focus:ring-blue-500/20"
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
            placeholder="Enter your password"
            autocomplete="current-password"
            minlength="6"
            required
            class="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 pr-12 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-blue-400/70 focus:bg-white/[0.09] focus:ring-2 focus:ring-blue-500/20"
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

      <!-- Error -->
      <div
        v-if="error"
        class="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
      >
        {{ error }}
      </div>

      <!-- Login -->
      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>

      <!-- Register -->
      <div class="pt-2 text-center text-sm text-white/55">
        Don't have an account?

        <NuxtLink
          to="/register"
          class="ml-1 font-semibold text-blue-400 transition hover:text-blue-300 hover:underline"
        >
          Register here
        </NuxtLink>
      </div>

    </form>
  </div>
</template>