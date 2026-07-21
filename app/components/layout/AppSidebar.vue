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
  UserCog,
  BarChart3,
  Settings,
  Sparkles,
} from 'lucide-vue-next'

interface NavItem {
  label: string
  to: string
  icon: typeof LayoutDashboard
}

// "Referees" was dropped and "Users" moved into Management per the latest
// screenshot — update both lists together if the nav changes again.
const mainNav: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Tournaments', to: '/tournaments', icon: Trophy },
  { label: 'Categories', to: '/categories', icon: Tags },
  { label: 'Athletes', to: '/athletes', icon: Users },
  { label: 'Tatamis', to: '/tatamis', icon: Waypoints },
  { label: 'Matches', to: '/admin/matches', icon: Swords },
  { label: 'Live Scoring', to: '/live', icon: Tv },
  { label: 'Brackets', to: '/brackets', icon: GitBranch },
]
const route = useRoute()
const isActive = (to: string) => route.path === to

const navLinkClass = (to: string) => [
  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors border',
  isActive(to)
    ? 'bg-blue-600/15 text-blue-400 border-blue-600/30'
    : 'text-muted hover:bg-surface hover:text-foreground border-transparent',
]
</script>

<template>
  <aside class="hidden lg:flex w-64 shrink-0 flex-col bg-panel border-r border-line">
    <!-- Logo -->
    <div class="flex items-center gap-3 px-5 h-16 border-b border-line">
      <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
        <Swords class="h-5 w-5 text-foreground" />
      </div>
      <div class="leading-tight">
        <p class="text-sm font-bold text-foreground">Karate System</p>
        <p class="text-[11px] font-semibold tracking-wide text-muted">TOURNAMENT MANAGER</p>
      </div>
    </div>

    <!-- Main nav -->
    <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-1">
      <NuxtLink v-for="item in mainNav" :key="item.to" :to="item.to" :class="navLinkClass(item.to)">
        <component :is="item.icon" class="h-[18px] w-[18px]" />
        {{ item.label }}
      </NuxtLink>

    </nav>

    <!-- Pro plan promo card -->
    <div class="p-3 border-t border-line">
      <div class="rounded-xl bg-surface border border-line p-3">
        <div class="flex items-center gap-2">
          <div class="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15 border border-amber-500/30">
            <Sparkles class="h-4 w-4 text-amber-400" />
          </div>
          <p class="text-xs font-bold tracking-wide text-amber-400">PRO PLAN</p>
        </div>
        <p class="mt-2 text-xs text-muted leading-snug">Advanced bracket logistics enabled.</p>
      </div>
    </div>
  </aside>
</template>