<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'referee',
})

const { user } = useAuth()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">My Profile</h1>
      <p class="mt-1 text-sm text-muted">
        Your referee account details
      </p>
    </div>

    <div class="rounded-xl border border-line bg-surface p-6 max-w-lg space-y-4">
      <div>
        <p class="text-xs text-muted uppercase tracking-wider">Name</p>
        <p class="mt-1 font-medium text-foreground">{{ user?.name || '—' }}</p>
      </div>

      <div>
        <p class="text-xs text-muted uppercase tracking-wider">Email</p>
        <p class="mt-1 font-medium text-foreground">{{ user?.email || '—' }}</p>
      </div>

      <div>
        <p class="text-xs text-muted uppercase tracking-wider">Role</p>
        <p class="mt-1 font-medium text-foreground">Referee</p>
      </div>
    </div>
  </div>
</template>