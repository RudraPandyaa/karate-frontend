<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
definePageMeta({
  layout: 'auth',
})

const { login } = useAuth()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)
const handleLogin = async () => {
  console.log('1. Login button clicked')

  loading.value = true

  try {
    console.log('2. Calling login API')

    const success = await login(email.value, password.value)

    console.log('3. Login result:', success)

    if (success) {
      console.log('4. Navigating to dashboard')

      await navigateTo('/dashboard')

      console.log('5. Navigation completed')
    } else {
      console.log('Login returned false')
      alert('Login failed')
    }
  } catch (error) {
    console.error('Login handler error:', error)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-canvas">
    <div class="w-full max-w-md p-8 bg-surface rounded-3xl border border-line">
      <h1 class="text-3xl font-bold text-center mb-8 text-foreground">WKF Manager</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
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
            class="w-full bg-panel border border-line rounded-xl px-4 py-3 pr-12 text-foreground"
          />

          <button
            v-if="password"
            type="button"
            @mousedown="showPassword = true"
            @mouseup="showPassword = false"
            @mouseleave="showPassword = false"
            @touchstart.prevent="showPassword = true"
            @touchend="showPassword = false"
            class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            <Eye class="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-medium text-white"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <div class="text-center">
          <span class="text-muted">
            Don't have an account?
          </span>

          <NuxtLink
            to="/register"
            class="ml-2 text-blue-500 hover:text-blue-400 hover:underline font-medium"
          >
            Register here
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>