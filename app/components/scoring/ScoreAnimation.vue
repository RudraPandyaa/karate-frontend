<script setup lang="ts">
export type ScoreFlash = {
  corner: 'RED' | 'BLUE'
  type: 'YUKO' | 'WAZA_ARI' | 'IPPON'
} | null

const props = defineProps<{
  flash: ScoreFlash
}>()

const label = computed(() => {
  if (!props.flash) return ''
  switch (props.flash.type) {
    case 'YUKO':
      return 'YUKO'
    case 'WAZA_ARI':
      return 'WAZA-ARI'
    case 'IPPON':
      return 'IPPON'
    default:
      return ''
  }
})

const pointsLabel = computed(() => {
  if (!props.flash) return ''
  if (props.flash.type === 'YUKO') return '+1'
  if (props.flash.type === 'WAZA_ARI') return '+2'
  return '+3'
})

const isRed = computed(() => props.flash?.corner === 'RED')
</script>

<template>
  <Teleport to="body">
    <Transition name="score-flash">
      <div
        v-if="flash"
        class="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0"
          :class="isRed ? 'bg-red-950/50' : 'bg-blue-950/50'"
        />

        <!-- Card -->
        <div
          class="relative rounded-3xl border-4 px-16 py-10 text-center shadow-2xl"
          :class="
            isRed
              ? 'border-red-500 bg-red-950/90'
              : 'border-blue-500 bg-blue-950/90'
          "
        >
          <p
            class="text-sm font-bold uppercase tracking-[0.35em]"
            :class="isRed ? 'text-red-300' : 'text-blue-300'"
          >
            {{ isRed ? 'AKA' : 'AO' }}
          </p>

          <p
            class="mt-2 text-6xl font-black tracking-wider sm:text-8xl"
            :class="isRed ? 'text-red-400' : 'text-blue-400'"
          >
            {{ label }}
          </p>

          <p class="mt-3 text-3xl font-bold text-white/80">
            {{ pointsLabel }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.score-flash-enter-active {
  transition: all 0.25s ease-out;
}
.score-flash-leave-active {
  transition: all 0.35s ease-in;
}
.score-flash-enter-from {
  opacity: 0;
  transform: scale(0.85);
}
.score-flash-leave-to {
  opacity: 0;
  transform: scale(1.05);
}
</style>