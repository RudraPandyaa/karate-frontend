<script setup lang="ts">
import { Bell, Menu } from 'lucide-vue-next'

const { user } = useAuth()

const roleLabel = computed(() => {
  switch (user.value?.role) {
    case 'SUPER_ADMIN':
      return 'Super Admin'
    case 'ADMIN':
      return 'Administrator'
    case 'ORGANIZER':
      return 'Organizer'
    case 'SCOREKEEPER':
      return 'Scorekeeper'
    case 'REFEREE':
      return 'Referee'
    case 'ATHLETE':
      return 'Athlete'
    default:
      return 'User'
  }
})
</script>

<template>
  <header
    class="flex h-16 shrink-0 items-center justify-between border-b border-line bg-panel px-4 lg:px-6"
  >
    <!-- Mobile menu -->
    <button
      class="rounded-lg p-2 text-muted hover:bg-surface hover:text-foreground lg:hidden"
    >
      <Menu class="h-5 w-5" />
    </button>

    <!-- Page area -->
    <div class="hidden lg:block">
      <p class="text-sm font-medium text-foreground">
        Karate Tournament Manager
      </p>

      <p class="text-xs text-muted">
        {{ roleLabel }}
      </p>
    </div>

    <!-- Right side -->
    <div class="ml-auto flex items-center gap-3">
      <button
        class="relative rounded-lg p-2 text-muted transition hover:bg-surface hover:text-foreground"
      >
        <Bell class="h-5 w-5" />

        <!-- Notification indicator -->
        <span
          class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500"
        />
      </button>

      <div class="hidden h-6 w-px bg-line sm:block" />

      <div class="flex items-center gap-2">
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white"
        >
          {{ user?.name?.charAt(0)?.toUpperCase() || 'U' }}
        </div>

        <div class="hidden sm:block">
          <p class="max-w-32 truncate text-sm font-medium text-foreground">
            {{ user?.name || 'User' }}
          </p>

          <p class="text-[11px] text-muted">
            {{ roleLabel }}
          </p>
        </div>
      </div>
    </div>
  </header>
</template>