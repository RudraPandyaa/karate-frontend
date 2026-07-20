<script setup lang="ts">
const { user, isLoggedIn, logout } = useAuth()

const handleLogout = async () => {
  await logout()
  await navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-canvas">
    <header class="h-16 border-b border-line bg-panel px-4 lg:px-8">
      <div class="mx-auto flex h-full max-w-7xl items-center justify-between">

        <!-- Logo -->
        <NuxtLink
          :to="isLoggedIn ? '/' : '/dashboard'"
          class="flex items-center gap-3"
        >
          <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
            <span class="text-white font-bold">K</span>
          </div>

          <div>
            <p class="font-bold text-foreground">
              Karate System
            </p>

            <p class="text-xs text-muted">
              LIVE TOURNAMENT
            </p>
          </div>
        </NuxtLink>

        <!-- Navigation -->
        <nav class="hidden items-center gap-6 md:flex">

          <NuxtLink
            to="/live"
            class="text-sm text-muted hover:text-foreground"
          >
            Live
          </NuxtLink>

          <NuxtLink
            to="/matches"
            class="text-sm text-muted hover:text-foreground"
          >
            Matches
          </NuxtLink>

          <!-- Logged out -->
          <NuxtLink
            v-if="!isLoggedIn"
            to="/login"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Login
          </NuxtLink>

          <!-- Logged in -->
          <div
            v-else
            class="flex items-center gap-3"
          >
            <span class="hidden lg:block text-sm text-muted">
              {{ user?.name || user?.email }}
            </span>

            <button
              @click="handleLogout"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>

        </nav>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>