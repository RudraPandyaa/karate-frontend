<script setup lang="ts">
const { login, isStaff } = useAuth()
const email = ref('')
const password = ref('')
const loading = ref(false)

const handleLogin = async () => {
  loading.value = true
  const success = await login(email.value, password.value)
  if (success) {
    await navigateTo(isStaff.value ? '/' : '/matches')
  } else {
    alert('Login failed')
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-zinc-950">
    <div class="w-full max-w-md p-8 bg-surface rounded-3xl border border-line">
      <h1 class="text-3xl font-bold text-center mb-8">WKF Manager</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-6">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          required
          class="w-full bg-zinc-900 border border-line rounded-xl px-4 py-3"
        />

        <input
          v-model="password"
          type="password"
          placeholder="Password"
          required
          class="w-full bg-zinc-900 border border-line rounded-xl px-4 py-3"
        />

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-medium"
        >
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>

        <div class="text-center">
          <span class="text-zinc-400">
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