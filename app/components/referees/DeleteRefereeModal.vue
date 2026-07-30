<script setup lang="ts">
import { Loader2, AlertTriangle } from 'lucide-vue-next'

defineProps<{
  open: boolean
  loading?: boolean
  refereeName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div class="w-full max-w-sm rounded-3xl border border-line bg-panel shadow-2xl p-6">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <AlertTriangle class="h-5 w-5 text-red-400" />
          </div>
          <h2 class="text-lg font-bold text-foreground">Delete Referee</h2>
        </div>

        <p class="text-sm text-muted">
          Are you sure you want to delete <span class="text-foreground font-medium">{{ refereeName }}</span>?
          This can't be undone.
        </p>

        <div class="flex items-center justify-end gap-3 mt-6">
          <button
            class="rounded-xl border border-line px-5 py-2.5 hover:bg-surface transition"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            :disabled="loading"
            class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-white hover:bg-red-700 disabled:opacity-60"
            @click="emit('delete')"
          >
            <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
            Delete
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>