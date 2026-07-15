<script setup lang="ts">
import type { Notification } from '~/types/notification'
import NotificationItem from './NotificationItem.vue'

defineProps<{
  notifications: Notification[]
  loading: boolean
}>()

const emit = defineEmits<{
  close: []
  'mark-all': []
}>()

const dropdown = ref<HTMLElement | null>(null)

// Close when clicking outside
onMounted(() => {
  const handler = (event: MouseEvent) => {
    if (
      dropdown.value &&
      !dropdown.value.contains(event.target as Node)
    ) {
      emit('close')
    }
  }

  document.addEventListener('click', handler)

  onUnmounted(() => {
    document.removeEventListener('click', handler)
  })
})
</script>

<template>
  <div
    ref="dropdown"
    class="absolute right-0 mt-3 w-[380px] rounded-2xl border border-line bg-surface shadow-2xl z-50 overflow-hidden"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between border-b border-line px-5 py-4"
    >
      <div>
        <h2 class="font-semibold text-foreground">
          Notifications
        </h2>

        <p class="text-xs text-muted">
          Tournament updates
        </p>
      </div>

      <button
        class="text-xs text-blue-500 hover:text-blue-400"
        @click="emit('mark-all')"
      >
        Mark all read
      </button>
    </div>

    <!-- Loading -->
    <div
      v-if="loading"
      class="p-6 text-center text-sm text-muted"
    >
      Loading notifications...
    </div>

    <!-- Empty -->
    <div
      v-else-if="notifications.length === 0"
      class="p-8 text-center"
    >
      <div class="text-5xl mb-2">
        🔔
      </div>

      <p class="font-medium text-foreground">
        No Notifications
      </p>

      <p class="mt-1 text-sm text-muted">
        You're all caught up.
      </p>
    </div>

    <!-- List -->
    <div
      v-else
      class="max-h-[420px] overflow-y-auto"
    >
      <NotificationItem
        v-for="notification in notifications"
        :key="notification.id"
        :notification="notification"
      />
    </div>

    <!-- Footer -->
    <div
      class="border-t border-line p-3"
    >
      <NuxtLink
        to="/notifications"
        class="block rounded-lg bg-panel py-2 text-center text-sm font-medium text-blue-500 hover:bg-surface-hover"
      >
        View All Notifications
      </NuxtLink>
    </div>
  </div>
</template>