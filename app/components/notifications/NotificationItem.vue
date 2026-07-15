<script setup lang="ts">
import {
  Swords,
  Trophy,
  Bell,
} from 'lucide-vue-next'

interface Notification {
  id: string
  title: string
  message: string
  time: string
  type: 'match' | 'tournament' | 'system'
  read?: boolean
}

const props = defineProps<{
  notification: Notification
}>()

const icon = computed(() => {
  switch (props.notification.type) {
    case 'match':
      return Swords

    case 'tournament':
      return Trophy

    default:
      return Bell
  }
})

const iconColor = computed(() => {
  switch (props.notification.type) {
    case 'match':
      return 'text-blue-500 bg-blue-500/10'

    case 'tournament':
      return 'text-amber-500 bg-amber-500/10'

    default:
      return 'text-green-500 bg-green-500/10'
  }
})
</script>

<template>
  <div
    class="flex gap-3 rounded-xl p-3 hover:bg-surface transition cursor-pointer"
  >
    <!-- Icon -->
    <div
      class="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
      :class="iconColor"
    >
      <component
        :is="icon"
        class="h-5 w-5"
      />
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <div class="flex justify-between items-start">
        <h4
          class="font-medium text-sm"
          :class="notification.read ? 'text-muted' : 'text-white'"
        >
          {{ notification.title }}
        </h4>

        <span class="text-xs text-muted whitespace-nowrap">
          {{ notification.time }}
        </span>
      </div>

      <p class="text-xs text-muted mt-1 line-clamp-2">
        {{ notification.message }}
      </p>

      <div
        v-if="!notification.read"
        class="mt-2 flex items-center gap-2"
      >
        <div class="h-2 w-2 rounded-full bg-blue-500" />

        <span class="text-xs text-blue-400">
          New
        </span>
      </div>
    </div>
  </div>
</template>