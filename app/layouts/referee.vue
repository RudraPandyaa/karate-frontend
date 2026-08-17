<script setup lang="ts">
import {
  LayoutDashboard,
  Swords,
  History,
  User,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
} from 'lucide-vue-next'

const { user, logout } = useAuth()
const route = useRoute()
const colorMode = useColorMode()
const mobileOpen = ref(false)

const menu = [
  { label: 'Dashboard', to: '/referee/dashboard', icon: LayoutDashboard },
  { label: 'My Matches', to: '/referee/matches', icon: Swords },
  { label: 'History', to: '/referee/history', icon: History },
  { label: 'Profile', to: '/referee/profile', icon: User },
]

const pageTitle = computed(() => {
  const item = menu.find(
    (m) => route.path === m.to || route.path.startsWith(`${m.to}/`),
  )
  return item?.label || 'Referee'
})

const isActive = (to: string) =>
  route.path === to || route.path.startsWith(`${to}/`)

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

watch(
  () => route.path,
  () => {
    mobileOpen.value = false
  },
)
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-canvas text-foreground">
    <!-- Desktop sidebar -->
    <aside class="hidden h-full w-64 shrink-0 flex-col border-r border-line bg-panel lg:flex">
      <div class="flex h-16 shrink-0 items-center gap-3 border-b border-line px-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <span class="font-bold text-white">R</span>
        </div>
        <div>
          <p class="font-bold leading-tight">Karate System</p>
          <p class="text-[11px] uppercase tracking-wider text-muted">
            Referee Portal
          </p>
        </div>
      </div>

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

      <div class="shrink-0 border-t border-line p-4">
        <div class="mb-3 flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {{ user?.name?.charAt(0)?.toUpperCase() || 'R' }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ user?.name || 'Referee' }}</p>
            <p class="text-xs text-muted">Referee</p>
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

    <!-- Mobile overlay -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="mobileOpen = false"
    />

    <!-- Mobile drawer -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line bg-panel transition-transform duration-200 lg:hidden"
      :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-14 items-center justify-between border-b border-line px-4">
        <p class="font-bold">Referee Portal</p>
        <button
          class="rounded-lg p-2 text-muted hover:bg-surface-hover"
          @click="mobileOpen = false"
        >
          <X class="h-5 w-5" />
        </button>
      </div>
      <nav class="flex-1 space-y-1 p-3">
        <NuxtLink
          v-for="item in menu"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
          :class="isActive(item.to)
            ? 'bg-amber-600/15 text-amber-400'
            : 'text-muted'"
          @click="mobileOpen = false"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </NuxtLink>
      </nav>
      <div class="border-t border-line p-4">
        <button
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400"
          @click="logout"
        >
          <LogOut class="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-panel px-3 lg:h-16 lg:px-6">
        <div class="flex min-w-0 items-center gap-2">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface lg:hidden"
            @click="mobileOpen = true"
          >
            <Menu class="h-5 w-5" />
          </button>
          <div class="min-w-0">
            <p class="truncate font-semibold">{{ pageTitle }}</p>
            <p class="hidden truncate text-xs text-muted sm:block">
              {{ user?.name }} · Referee
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface"
            @click="toggleTheme"
          >
            <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </button>
          <button
            class="hidden rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 sm:block"
            @click="logout"
          >
            Logout
          </button>
        </div>
      </header>

      <main class="flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>