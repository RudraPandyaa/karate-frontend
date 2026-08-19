<script setup lang="ts">
import {
  LayoutDashboard,
  Trophy,
  Tags,
  Users,
  Waypoints,
  Swords,
  Tv,
  GitBranch,
  Shield,
  GraduationCap,
  BarChart3,
  User,
  Building2,
} from 'lucide-vue-next'

import type { Role } from '~/types'

interface NavItem {
  label: string
  to: string
  icon: any
}

const { user } = useAuth()
const route = useRoute()

// Full staff navigation (SUPER_ADMIN, ADMIN, ORGANIZER)
const fullStaffNav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Organizations', to: '/organizations', icon: Building2 },
  { label: 'Tournaments', to: '/tournaments', icon: Trophy },
  { label: 'Categories', to: '/categories', icon: Tags },
  { label: 'Athletes', to: '/athletes', icon: Users },
  { label: 'Referees', to: '/referees', icon: Shield },
  // { label: 'Coaches', to: '/coaches', icon: GraduationCap },
  { label: 'Tatamis', to: '/tatamis', icon: Waypoints },
  { label: 'Matches', to: '/admin/matches', icon: Swords },
  { label: 'Live Scoring', to: '/scoring-control', icon: Tv },
  { label: 'Brackets', to: '/brackets', icon: GitBranch },
  { label: 'Users', to: '/users', icon: Users },
]

// Scorekeeper navigation
const scorekeeperNav: NavItem[] = [
  { label: 'Dashboard', to: '/scorekeeper/dashboard', icon: LayoutDashboard },
  { label: 'Matches', to: '/scorekeeper/matches', icon: Swords },
  { label: 'Live Scoring', to: '/scoring-control', icon: Tv },
  { label: 'Tatamis', to: '/tatamis', icon: Waypoints },
  { label: 'Brackets', to: '/brackets', icon: GitBranch },
  { label: 'Results', to: '/scorekeeper/results', icon: BarChart3 },
]

// Referee navigation
const refereeNav: NavItem[] = [
  { label: 'Dashboard', to: '/referee/dashboard', icon: LayoutDashboard },
  { label: 'My Matches', to: '/referee/matches', icon: Swords },
  { label: 'Live Scoring', to: '/scoring-control', icon: Tv },
  { label: 'Match History', to: '/referee/history', icon: BarChart3 },
  { label: 'Profile', to: '/referee/profile', icon: User },
]

const navigationByRole: Partial<Record<Role, NavItem[]>> = {
  SUPER_ADMIN: fullStaffNav,
  ADMIN: fullStaffNav,
  ORGANIZER: fullStaffNav,
  SCOREKEEPER: scorekeeperNav,
  REFEREE: refereeNav,
}

const navigation = computed(() => {
  const role = user.value?.role as Role | undefined
  return navigationByRole[role as Role] ?? []
})

function isActive(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function navLinkClass(to: string) {
  return [
    'flex items-center gap-3 rounded-lg px-3 py-2.5',
    'text-sm font-medium transition-colors border',
    isActive(to)
      ? 'bg-blue-600/15 text-blue-400 border-blue-600/30'
      : 'text-muted hover:bg-surface hover:text-foreground border-transparent',
  ]
}

const roleLabel = computed(() => {
  switch (user.value?.role) {
    case 'SUPER_ADMIN': return 'Super Admin'
    case 'ADMIN': return 'Administrator'
    case 'ORGANIZER': return 'Organizer'
    case 'SCOREKEEPER': return 'Scorekeeper'
    case 'REFEREE': return 'Referee'
    default: return 'Staff Portal'
  }
})
</script>

<template>
  <aside
    class="hidden h-full w-64 shrink-0 flex-col border-r border-line bg-panel lg:flex"
  >
    <!-- Brand -->
    <div class="flex items-center gap-3 px-5 h-16 border-b border-line">
      <div
        class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white"
      >
        <Swords class="h-5 w-5" />
      </div>

      <div class="leading-tight">
        <p class="text-sm font-bold text-foreground">
          Karate System
        </p>

        <p
          class="text-[11px] font-semibold tracking-wide text-muted uppercase"
        >
          {{ roleLabel }}
        </p>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      <NuxtLink
        v-for="item in navigation"
        :key="item.to"
        :to="item.to"
        :class="navLinkClass(item.to)"
      >
        <component
          :is="item.icon"
          class="h-[18px] w-[18px]"
        />

        <span>
          {{ item.label }}
        </span>
      </NuxtLink>
    </nav>

    <!-- User -->
    <div class="border-t border-line p-4">
      <div class="flex items-center gap-3">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white"
        >
          {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
        </div>

        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-foreground">
            {{ user?.name || 'User' }}
          </p>

          <p class="text-xs text-muted">
            {{ roleLabel }}
          </p>
        </div>
      </div>
    </div>
  </aside>
</template>