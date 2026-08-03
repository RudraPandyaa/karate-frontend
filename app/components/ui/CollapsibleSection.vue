<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

defineProps<{
  defaultOpen?: boolean
}>()

const isOpen = ref(false)
</script>

<template>
  <div class="rounded-2xl border border-line bg-surface overflow-hidden">
    <button
      class="w-full bg-canvas/60 px-6 py-4 flex items-center justify-between text-left"
      @click="isOpen = !isOpen"
    >
      <slot name="header" :open="isOpen" />
      <ChevronDown
        class="h-5 w-5 text-muted shrink-0 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      leave-active-class="transition-all duration-150 ease-in"
      enter-from-class="max-h-0 opacity-0"
      enter-to-class="max-h-[2000px] opacity-100"
      leave-from-class="max-h-[2000px] opacity-100"
      leave-to-class="max-h-0 opacity-0"
    >
      <div v-if="isOpen" class="overflow-hidden">
        <slot />
      </div>
    </Transition>
  </div>
</template>