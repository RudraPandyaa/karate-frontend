<script setup lang="ts">
export type MatchWinner = {
  corner: 'RED' | 'BLUE'
  athleteName?: string
} | null

const props = defineProps<{
  winner: MatchWinner
}>()

const emit = defineEmits<{
  dismiss: []
}>()

const isRed = computed(() => props.winner?.corner === 'RED')
</script>

<template>
  <Teleport to="body">
    <Transition name="winner-flash">
      <div
        v-if="winner"
        class="fixed inset-0 z-[110] flex items-center justify-center"
        @click="emit('dismiss')"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0"
          :class="isRed ? 'bg-red-950/70' : 'bg-blue-950/70'"
        />

        <!-- Card -->
        <div
          class="relative rounded-3xl border-4 px-20 py-14 text-center shadow-2xl"
          :class="
            isRed
              ? 'border-red-500 bg-red-950/95'
              : 'border-blue-500 bg-blue-950/95'
          "
        >
          <p
            class="text-sm font-bold uppercase tracking-[0.4em]"
            :class="isRed ? 'text-red-300' : 'text-blue-300'"
          >
            {{ isRed ? 'AKA' : 'AO' }} WINS
          </p>

          <p
            class="mt-3 text-7xl font-black tracking-wider sm:text-9xl"
            :class="isRed ? 'text-red-400' : 'text-blue-400'"
          >
            WINNER
          </p>

          <p
            v-if="winner.athleteName"
            class="mt-4 text-2xl font-bold text-white/90 sm:text-4xl"
          >
            {{ winner.athleteName }}
          </p>

          <p class="mt-6 text-xs uppercase tracking-widest text-white/40">
            Tap to continue
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.winner-flash-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.winner-flash-leave-active {
  transition: all 0.5s ease-in;
}
.winner-flash-enter-from {
  opacity: 0;
  transform: scale(0.7);
}
.winner-flash-leave-to {
  opacity: 0;
  transform: scale(1.1);
}
</style>