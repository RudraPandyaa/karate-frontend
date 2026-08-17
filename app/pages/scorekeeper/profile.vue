<script setup lang="ts">
definePageMeta({
  layout: 'scorekeeper',
  middleware: 'scorekeeper',
})

const { user, logout } = useAuth()
</script>

<template>
  <div class="mx-auto max-w-lg space-y-6 p-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">My Profile</h1>
      <p class="mt-1 text-sm text-muted">
        Your scorekeeper account details
      </p>
    </div>

    <section class="rounded-2xl border border-line bg-surface p-6">
      <div class="flex items-center gap-4">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-xl font-bold text-white">
          {{ user?.name?.charAt(0)?.toUpperCase() || 'S' }}
        </div>
        <div class="min-w-0">
          <h2 class="truncate text-lg font-semibold text-foreground">
            {{ user?.name || 'Scorekeeper' }}
          </h2>
          <p class="text-sm text-muted">Scorekeeper</p>
        </div>
      </div>

      <div class="mt-6 space-y-4 text-sm">
        <div class="flex items-center justify-between gap-4 border-t border-line pt-4">
          <span class="text-muted">Name</span>
          <span class="font-medium text-foreground text-right">
            {{ user?.name || '—' }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span class="text-muted">Email</span>
          <span class="break-all font-medium text-foreground text-right">
            {{ user?.email || '—' }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <span class="text-muted">Role</span>
          <span class="rounded-full bg-blue-600/15 px-2.5 py-1 text-xs font-semibold text-blue-400">
            SCOREKEEPER
          </span>
        </div>
      </div>

      <button
        class="mt-6 w-full rounded-xl border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10"
        @click="logout"
      >
        Logout
      </button>
    </section>
  </div>
</template>