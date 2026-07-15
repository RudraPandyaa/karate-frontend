<script setup lang="ts">
import { Bell } from 'lucide-vue-next'
import NotificationDropdown from './NotificationDropdown.vue'

const show = ref(false)

const notifications = ref([
  {
    id: '1',
    title: 'Upcoming Match',
    message: 'Tatami 1 • John vs Alex starts in 5 minutes',
    time: '5m',
    type: 'match',
    read: false,
  },
  {
    id: '2',
    title: 'Match Completed',
    message: 'Tatami 2 has completed Match #14',
    time: '12m',
    type: 'match',
    read: true,
  },
  {
    id: '3',
    title: 'Tournament',
    message: 'Quarter Finals are about to begin.',
    time: '25m',
    type: 'tournament',
    read: false,
  },
])

const unread = computed(() =>
  notifications.value.filter(n => !n.read).length
)

const wrapper = ref<HTMLElement>()

onClickOutside(wrapper, () => {
  show.value = false
})
</script>

<template>
  <div
    ref="wrapper"
    class="relative"
  >
    <button
      @click="show = !show"
      class="relative grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-surface hover:text-foreground transition-colors"
    >
      <Bell class="h-5 w-5"/>

      <span
        v-if="unread"
        class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white"
      >
        {{ unread }}
      </span>
    </button>

    <NotificationDropdown
      v-if="show"
      :notifications="notifications"
    />
  </div>
</template>