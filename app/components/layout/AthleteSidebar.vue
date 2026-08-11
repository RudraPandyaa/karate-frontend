<script setup lang="ts">
import {
  LayoutDashboard,
  Swords,
  Calendar,
  Trophy,
  Tags,
  User,
  LogOut,
} from 'lucide-vue-next'

const { user, logout } = useAuth()
const route = useRoute()

const menu = [
  { label: 'Dashboard', to: '/athletes/dashboard', icon: LayoutDashboard },
  { label: 'My Matches', to: '/athletes/matches', icon: Swords },
  { label: 'Schedule', to: '/athletes/schedule', icon: Calendar },
  { label: 'My Categories', to: '/athletes/categories', icon: Tags },
  { label: 'Results', to: '/athletes/results', icon: Trophy },
  { label: 'Profile', to: '/athletes/profile', icon: User },
]

function isActive(path: string) {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>

<template>
  <aside class="flex h-full w-64 flex-col border-r border-line bg-panel">
    <!-- Brand -->
    <div class="flex h-16 items-center gap-3 border-b border-line px-5">
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
        <span class="font-bold text-white">K</span>
      </div>
      <div>
        <p class="font-bold leading-tight">Karate System</p>
        <p class="text-[11px] uppercase tracking-wider text-muted">Athlete Portal</p>
      </div>
    </div>

    <!-- Menu -->
    <nav class="flex-1 space-y-1 p-3">
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

    <!-- Athlete mini profile -->
    <div class="border-t border-line p-4">
      <div class="mb-3 flex items-center gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {{ user?.name?.charAt(0)?.toUpperCase() || 'A' }}
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">{{ user?.name || 'Athlete' }}</p>
          <p class="text-xs text-muted">Athlete Account</p>
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
</template>