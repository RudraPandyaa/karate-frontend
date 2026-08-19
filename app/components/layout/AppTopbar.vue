<script setup lang="ts">
import { Search, Bell, CircleUserRound, Sun, Moon, LogOut } from 'lucide-vue-next'
import { useAuth } from '~/composables/useAuth'
import TournamentSelectorModal from '~/components/TournamentSelectorModal.vue'
import NotificationBell from '~/components/notifications/NotificationBell.vue'
const search = useState('topbarSearch', () => '')
const { user, logout } = useAuth()
const colorMode = useColorMode()

const showTournamentModal = ref(false)
const showUserMenu = ref(false)
const userMenuRef = ref<HTMLElement | null>(null)
const { selectTournament, selectedTournamentName } = useSelectedTournament()

// @select="{ id, name }"  OR  @select="id"
function onSelectTournament(payload: { id: string; name?: string } | string) {
  if (typeof payload === 'string') selectTournament(payload)
  else selectTournament(payload.id, payload.name)
  showTournamentModal.value = false
  navigateTo('/dashboard')
}
const handleClickOutside = (event: MouseEvent) => {
  if (
    showUserMenu.value &&
    userMenuRef.value &&
    !userMenuRef.value.contains(event.target as Node)
  ) {
    showUserMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})  

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const canSelectTournament = computed(() =>
  ['ADMIN','SUPER_ADMIN','ORGANIZER'].includes(user.value?.role || '')
)
const isDark = computed(() => colorMode.value === 'dark')

watch(
  () => colorMode.value,
  value => console.log(value)
)
// Theme Toggle
const toggleTheme = () => {
  colorMode.preference =
    colorMode.preference === 'dark'
      ? 'light'
      : 'dark'
}

// Tournament Selector
const openTournamentSelector = () => {
  showTournamentModal.value = true
}

// const selectTournament = (tournamentId: string) => {
//   // You can store selected tournament globally if needed
//   showTournamentModal.value = false
//   navigateTo('/dashboard')
// }
</script>

<template>
  <header class="flex h-16 items-center justify-between gap-4 border-b border-line bg-panel px-4 lg:px-6">
    <div class="flex items-center gap-3 min-w-0">
      <h1 class="hidden sm:block text-lg font-bold text-foreground shrink-0">WKF Manager</h1>
      
      <div class="relative w-full max-w-sm hidden md:block">
        <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          v-model="search"
          type="text"
          placeholder="Search athletes, matches..."
          class="w-full rounded-full bg-surface border border-line py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/40"
        />
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Select Tournament -->
      <ClientOnly>
       <button
          v-if="canSelectTournament"
          type="button"
          class="max-w-[200px] truncate rounded-full border border-blue-600/30 bg-blue-600/15 px-4 py-2 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-600/25"
          @click="openTournamentSelector"
        >
          {{ selectedTournamentName || 'Select Tournament' }}
        </button>
      </ClientOnly>

      <!-- Theme Toggle -->
      <button
        @click="toggleTheme"
        class="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-foreground transition-colors"
      >
        <ClientOnly>
          <Sun v-if="!isDark" class="h-5 w-5" />
          <Moon v-else class="h-5 w-5" />
          <template #fallback>
            <div class="h-5 w-5" />
          </template>
        </ClientOnly>
      </button>

      <!-- Notifications -->
        <NotificationBell />

      <!-- User Menu -->
      <div
        ref="userMenuRef"
        class="relative"
      >
        <button
          @click="showUserMenu = !showUserMenu"
          class="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-foreground transition-colors"
        >
          <CircleUserRound class="h-5 w-5" />
        </button>

        <!-- User Dropdown -->
        <div v-if="showUserMenu" 
             class="absolute right-0 mt-2 w-64 bg-surface border border-line rounded-2xl shadow-2xl py-2 z-50">
          <div class="px-4 py-3 border-b border-line">
            <p class="font-medium text-foreground">{{ user?.name || 'Guest User' }}</p>
            <p class="text-xs text-muted">{{ user?.email || '' }}</p>
          </div>
          
          <button
            @click="logout"
            class="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut class="h-4 w-4" /> Logout
          </button>
        </div>
      </div>
    </div>
  </header>

  <!-- Tournament Selector Modal -->
<!-- Tournament Selector Modal -->
  <TournamentSelectorModal 
  :model-value="showTournamentModal"
  @close="showTournamentModal = false"
  @select="onSelectTournament"
  />
</template>