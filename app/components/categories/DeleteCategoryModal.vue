<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'

import type { Category } from '~/composables/useCategories'

const props = defineProps<{
  open: boolean
  loading: boolean
  category: Category | null
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

function handleClose() {
  if (props.loading) return
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        @click.self="handleClose"
      >
        <div class="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-xl">

          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
              <AlertTriangle class="h-5 w-5 text-red-400" />
            </div>

            <h2 class="text-lg font-semibold text-foreground">
              Delete Category
            </h2>
          </div>

          <p class="mt-4 text-sm text-muted">
            Are you sure you want to delete
            <span class="font-medium text-foreground">{{ category?.name }}</span>?
            This action cannot be undone and will remove any associated athletes and matches from this category.
          </p>

          <div class="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              class="rounded-xl border border-line px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-surface-hover disabled:opacity-50"
              :disabled="loading"
              @click="emit('close')"
            >
              Cancel
            </button>

            <button
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="loading"
              @click="emit('confirm')"
            >
              <span
                v-if="loading"
                class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              {{ loading ? 'Deleting…' : 'Delete' }}
            </button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>