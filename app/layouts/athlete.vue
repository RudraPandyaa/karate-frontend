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
  Menu,
  X,
} from 'lucide-vue-next'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'
import { Bell } from 'lucide-vue-next'
import { useAthleteNotifications } from '~/composables/useAthleteNotifications'
const {
  alerts,
  unreadCount,
  open: alertsOpen,
  dismiss,
  dismissAll,
  toggle: toggleAlerts,
  close: closeAlerts,
} = useAthleteNotifications()
const { user, logout } = useAuth()
const route = useRoute()
const colorMode = useColorMode()

const mobileOpen = ref(false)

const {
  dashboard,
  fetchDashboard,
} = useAthleteDashboard()

const menu = [
  { label: 'Dashboard', to: '/athletes/dashboard', icon: LayoutDashboard },
  { label: 'Matches', to: '/athletes/matches', icon: Swords },
  { label: 'Schedule', to: '/athletes/schedule', icon: Calendar },
  { label: 'My Categories', to: '/athletes/my-categories', icon: Tags },
  { label: 'Results', to: '/athletes/results', icon: Trophy },
  { label: 'Profile', to: '/athletes/profile', icon: User },
]

const pageTitle = computed(() => {
  const item = menu.find(
    (m) => route.path === m.to || route.path.startsWith(`${m.to}/`),
  )
  return item?.label || 'Athlete Portal'
})

const isActive = (to: string) =>
  route.path === to || route.path.startsWith(`${to}/`)

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

function closeMobile() {
  mobileOpen.value = false
}

watch(
  () => route.path,
  () => {
    mobileOpen.value = false
  },
)

// ----- Live / Next match widget -----
const athleteId = computed(() => dashboard.value?.athlete?.id || null)

const focusMatch = computed(() => {
  const live = dashboard.value?.liveMatches?.[0]
  if (live) return live
  return dashboard.value?.upcomingMatches?.[0] || null
})

const isLiveFocus = computed(() => {
  const s = focusMatch.value?.status
  return s === 'IN_PROGRESS' || s === 'PAUSED'
})

function athleteName(a?: any) {
  if (!a) return 'TBD'
  return (
    a.fullName ||
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    a.name ||
    'TBD'
  )
}

function shortName(a?: any) {
  const name = athleteName(a)
  if (name.length <= 14) return name
  return name.slice(0, 12) + '…'
}

const focusLink = computed(() => {
  if (!focusMatch.value) return '/athletes/matches'
  if (isLiveFocus.value) return `/live-scoring/${focusMatch.value.id}`
  return `/live-scoring/${focusMatch.value.id}`
})

// Initial load + poll every 20s while layout is mounted
onMounted(() => {
  fetchDashboard()
  const timer = setInterval(() => {
    fetchDashboard()
  }, 10000)

  onUnmounted(() => {
    clearInterval(timer)
  })
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-canvas text-foreground">
    <!-- Desktop sidebar -->
    <aside class="hidden h-full w-64 shrink-0 flex-col border-r border-line bg-panel lg:flex">
      <div class="flex h-16 shrink-0 items-center gap-3 border-b border-line px-5">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
          <span class="font-bold text-white">K</span>
        </div>
        <div>
          <p class="font-bold leading-tight">Karate System</p>
          <p class="text-[11px] uppercase tracking-wider text-muted">Athlete Portal</p>
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

      <!-- Live / Next match widget -->
      <div class="shrink-0 border-t border-line p-3">
        <NuxtLink
          :to="focusLink"
          class="block rounded-2xl border p-3 transition hover:bg-surface-hover"
          :class="isLiveFocus
            ? 'border-green-500/40 bg-green-500/10'
            : 'border-line bg-surface'"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <span
              class="text-[10px] font-bold uppercase tracking-wider"
              :class="isLiveFocus ? 'text-green-400' : 'text-muted'"
            >
              <span v-if="isLiveFocus" class="inline-flex items-center gap-1">
                <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                Live match
              </span>
              <span v-else-if="focusMatch">Next match</span>
              <span v-else>Match status</span>
            </span>
            <span
              v-if="focusMatch?.tatami"
              class="text-[10px] text-muted"
            >
              T{{ focusMatch.tatami.number }}
            </span>
          </div>

          <template v-if="focusMatch">
            <p class="truncate text-xs text-muted">
              {{ focusMatch.category?.name || 'Category' }}
            </p>

            <div class="mt-2 flex items-center justify-between gap-1 text-xs font-semibold">
              <span
                class="min-w-0 truncate"
                :class="focusMatch.redAthlete?.id === athleteId ? 'text-red-400' : 'text-foreground'"
              >
                {{ shortName(focusMatch.redAthlete) }}
              </span>
              <span class="shrink-0 tabular-nums text-foreground">
                {{ focusMatch.redScore ?? 0 }}–{{ focusMatch.blueScore ?? 0 }}
              </span>
              <span
                class="min-w-0 truncate text-right"
                :class="focusMatch.blueAthlete?.id === athleteId ? 'text-blue-400' : 'text-foreground'"
              >
                {{ shortName(focusMatch.blueAthlete) }}
              </span>
            </div>

            <p class="mt-2 text-[10px] font-medium text-blue-400">
              {{ isLiveFocus ? 'Tap to watch live →' : 'Tap for details →' }}
            </p>
          </template>

          <p v-else class="text-xs text-muted">
            No match scheduled
          </p>
        </NuxtLink>
      </div>

      <div class="shrink-0 border-t border-line p-4">
        <NuxtLink
          to="/athletes/profile"
          class="mb-3 flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-surface-hover"
        >
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {{ user?.name?.charAt(0)?.toUpperCase() || 'A' }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{{ user?.name || 'Athlete' }}</p>
            <p class="text-xs text-muted">Athlete</p>
          </div>
        </NuxtLink>

        <button
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          @click="logout"
        >
          <LogOut class="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>

    <!-- Mobile drawer overlay -->
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 bg-black/50 lg:hidden"
      @click="closeMobile"
    />

    <!-- Mobile drawer -->
    <aside
      class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-line bg-panel transition-transform duration-200 lg:hidden"
      :class="mobileOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex h-14 items-center justify-between border-b border-line px-4">
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span class="text-sm font-bold text-white">K</span>
          </div>
          <p class="font-bold">Athlete Portal</p>
        </div>
        <button
          class="rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-foreground"
          @click="closeMobile"
        >
          <X class="h-5 w-5" />
        </button>
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
          @click="closeMobile"
        >
          <component :is="item.icon" class="h-4 w-4" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Mobile: same widget -->
      <div class="shrink-0 border-t border-line p-3">
        <NuxtLink
          :to="focusLink"
          class="block rounded-2xl border p-3"
          :class="isLiveFocus
            ? 'border-green-500/40 bg-green-500/10'
            : 'border-line bg-surface'"
          @click="closeMobile"
        >
          <p
            class="text-[10px] font-bold uppercase tracking-wider"
            :class="isLiveFocus ? 'text-green-400' : 'text-muted'"
          >
            {{ isLiveFocus ? 'Live match' : focusMatch ? 'Next match' : 'Match status' }}
          </p>
          <template v-if="focusMatch">
            <p class="mt-1 text-xs font-medium text-foreground">
              {{ shortName(focusMatch.redAthlete) }}
              {{ focusMatch.redScore ?? 0 }}–{{ focusMatch.blueScore ?? 0 }}
              {{ shortName(focusMatch.blueAthlete) }}
            </p>
          </template>
          <p v-else class="mt-1 text-xs text-muted">No match scheduled</p>
        </NuxtLink>
      </div>

      <div class="border-t border-line p-4">
        <button
          class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10"
          @click="logout"
        >
          <LogOut class="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>

    <!-- Main -->
    <div class="flex min-w-0 flex-1 flex-col overflow-hidden">
      <header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-panel px-3 sm:px-4 lg:h-16 lg:px-6">
        <div class="flex min-w-0 items-center gap-2">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-foreground transition hover:bg-surface-hover lg:hidden"
            aria-label="Open menu"
            @click="mobileOpen = true"
          >
            <Menu class="h-5 w-5" />
          </button>

          <div class="min-w-0">
            <p class="truncate font-semibold text-foreground">
              {{ pageTitle }}
            </p>
            <p class="hidden truncate text-xs text-muted sm:block">
              {{ user?.name || 'Welcome' }} · Athlete
            </p>
          </div>
        </div>

        <!-- Topbar mini live badge (optional) -->
        <div class="flex shrink-0 items-center gap-2">
          <NuxtLink
            v-if="isLiveFocus && focusMatch"
            :to="`/live-scoring/${focusMatch.id}`"
            class="hidden items-center gap-1.5 rounded-full bg-green-500/15 px-2.5 py-1 text-[11px] font-bold text-green-400 sm:inline-flex"
          >
            <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
            LIVE {{ focusMatch.redScore ?? 0 }}–{{ focusMatch.blueScore ?? 0 }}
          </NuxtLink>
                    <!-- Notifications -->
          <div class="relative">
            <button
              class="relative flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-foreground transition hover:bg-surface-hover"
              aria-label="Notifications"
              @click="toggleAlerts"
            >
              <Bell class="h-4 w-4" />
              <span
                v-if="unreadCount > 0"
                class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
              >
                {{ unreadCount > 9 ? '9+' : unreadCount }}
              </span>
            </button>

            <!-- Backdrop -->
            <div
              v-if="alertsOpen"
              class="fixed inset-0 z-40"
              @click="closeAlerts"
            />

            <!-- Dropdown -->
            <div
              v-if="alertsOpen"
              class="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl"
            >
              <div class="flex items-center justify-between border-b border-line px-4 py-3">
                <p class="text-sm font-semibold text-foreground">Notifications</p>
                <button
                  v-if="alerts.length"
                  class="text-xs font-medium text-blue-400 hover:text-blue-300"
                  @click="dismissAll"
                >
                  Clear all
                </button>
              </div>

              <div v-if="!alerts.length" class="px-4 py-8 text-center text-sm text-muted">
                No new alerts
              </div>

              <ul v-else class="max-h-80 overflow-y-auto divide-y divide-line">
                <li v-for="alert in alerts" :key="alert.id">
                  <NuxtLink
                    :to="alert.to"
                    class="block px-4 py-3 transition hover:bg-surface-hover"
                    @click="dismiss(alert); closeAlerts()"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-foreground">
                          <span
                            v-if="alert.type === 'live'"
                            class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-green-400 align-middle"
                          />
                          {{ alert.title }}
                        </p>
                        <p class="mt-0.5 text-xs text-muted">
                          {{ alert.body }}
                        </p>
                      </div>
                      <button
                        class="shrink-0 text-xs text-muted hover:text-foreground"
                        @click.prevent.stop="dismiss(alert)"
                      >
                        ✕
                      </button>
                    </div>
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>
          <button
            class="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-foreground transition hover:bg-surface-hover"
            :title="colorMode.value === 'dark' ? 'Light mode' : 'Dark mode'"
            @click="toggleTheme"
          >
            <Sun v-if="colorMode.value === 'dark'" class="h-4 w-4" />
            <Moon v-else class="h-4 w-4" />
          </button>

          <NuxtLink
            to="/athletes/profile"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
            :title="user?.name || 'Profile'"
          >
            {{ user?.name?.charAt(0)?.toUpperCase() || 'A' }}
          </NuxtLink>

          <button
            class="hidden rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/10 sm:block"
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