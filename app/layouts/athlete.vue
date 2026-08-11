<script setup lang="ts">
import {
  LayoutDashboard,
  Swords,
  Calendar,
  Trophy,
  Tags,
  User,
  LogOut,
  Sun,
  Moon,
} from 'lucide-vue-next'

const { user, logout } = useAuth()
const route = useRoute()
const colorMode = useColorMode()

const menu = [
  { label: 'Dashboard', to: '/athletes/dashboard', icon: LayoutDashboard },
  { label: 'My Matches', to: '/athletes/matches', icon: Swords },
  { label: 'Schedule', to: '/athletes/schedule', icon: Calendar },
  { label: 'My Categories', to: '/athletes/categories', icon: Tags },
  { label: 'Results', to: '/athletes/results', icon: Trophy },
  { label: 'Profile', to: '/athletes/profile', icon: User },
]

const isActive = (to: string) =>
  route.path === to ||
  route.path.startsWith(`${to}/`)

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-canvas text-foreground">
    <!-- Sidebar (full height) -->
    <aside class="hidden h-full w-64 shrink-0 flex-col border-r border-line bg-panel lg:flex">
      <!-- Logo -->
      <div class="flex h-16 shrink-0 items-center gap-3 border-b border-line px-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <span class="font-bold text-white">K</span>
        </div>
        <div>
          <p class="font-bold leading-tight">Karate System</p>
          <p class="text-[11px] uppercase tracking-wider text-muted">Athlete Portal</p>
        </div>
      </div>

      <!-- Menu -->
      <nav class="flex-1 space-y-1 overflow-y-auto p-3">
        <NuxtLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition"
          :class="isActive(item.to)
            ? 'bg-blue-600/15 text-blue-400'
            : 'text-muted hover:bg-surface-hover hover:text-foreground'"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- User + Logout -->
      <div class="shrink-0 border-t border-line p-4">
        <div class="mb-3 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {{ user?.name?.charAt(0)?.toUpperCase() || 'A' }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ user?.name || 'Athlete' }}</p>
            <p class="text-xs text-muted">Athlete</p>
          </div>
        </div>

        <button
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          @click="logout"
        >
          <LogOut class="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>

    <!-- Main column -->
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <!-- Top bar -->
      <header class="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel px-4 lg:h-16 lg:px-6">
        <div class="min-w-0">
          <p class="truncate font-semibold text-foreground">Athlete Portal</p>
          <p class="hidden text-xs text-muted sm:block">
            {{ user?.name || 'Welcome' }}
          </p>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Theme toggle -->
          <button
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-foreground transition hover:bg-surface-hover"
            :title="colorMode.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggleTheme"
          >
            <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </button>

          <!-- Avatar -->
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {{ user?.name?.charAt(0)?.toUpperCase() || 'A' }}
          </div>

          <button
            class="hidden rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 sm:block"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </header>

      <!-- Mobile nav -->
      <div class="shrink-0 border-b border-line bg-panel lg:hidden">
        <nav class="flex gap-1 overflow-x-auto px-3 py-2">
          <NuxtLink
            v-for="item in menu"
            :key="item.to"
            :to="item.to"
            class="whitespace-nowrap rounded-lg px-3 py-2 text-sm"
            :class="isActive(item.to)
              ? 'bg-blue-600/15 text-blue-400'
              : 'text-muted'"
          >
            {{ item.label }}
          </NuxtLink>
        </nav>
      </div>

      <!-- Page content -->
      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>