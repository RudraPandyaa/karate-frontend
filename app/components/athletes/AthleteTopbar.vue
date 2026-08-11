<script setup lang="ts">
const { user, logout } = useAuth()

defineProps<{
  title?: string
  subtitle?: string
}>()
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-line bg-panel/95 backdrop-blur">
    <div class="flex h-16 items-center justify-between px-4 lg:px-8">
      <div>
        <h1 class="text-lg font-semibold text-foreground">
          {{ title || 'Athlete Portal' }}
        </h1>
        <p v-if="subtitle" class="text-xs text-muted">
          {{ subtitle }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <div class="hidden text-right sm:block">
          <p class="text-sm font-medium text-foreground">
            {{ user?.name || 'Athlete' }}
          </p>
          <p class="text-xs text-muted">Ready to compete</p>
        </div>

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
    </div>
  </header>
</template>