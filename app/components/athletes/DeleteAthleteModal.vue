<script setup lang="ts">
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  loading?: boolean
  athleteName?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      leave-active-class="transition duration-150 ease-in"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      >
        <div
          class="w-full max-w-md rounded-3xl border border-line bg-panel shadow-2xl overflow-hidden"
        >
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-line px-6 py-5">
            <div class="flex items-center gap-3">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15"
              >
                <AlertTriangle class="h-6 w-6 text-red-400" />
              </div>

              <div>
                <h2 class="text-lg font-bold text-white">
                  Delete Athlete
                </h2>
                <p class="text-sm text-muted">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <button
              class="rounded-lg p-2 hover:bg-surface transition"
              @click="emit('close')"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Body -->
          <div class="px-6 py-6 space-y-4">
            <p class="text-sm text-muted leading-6">
              Are you sure you want to permanently delete this athlete?
            </p>

            <div
              class="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
            >
              <p class="font-semibold text-red-300">
                {{ athleteName }}
              </p>
            </div>

            <p class="text-xs text-muted">
              Deleting an athlete will also remove related enrollments.
              Existing match history may become invalid depending on your backend rules.
            </p>
          </div>

          <!-- Footer -->
          <div
            class="flex items-center justify-end gap-3 border-t border-line px-6 py-5"
          >
            <button
              class="rounded-xl border border-line px-5 py-2 hover:bg-surface transition"
              :disabled="loading"
              @click="emit('close')"
            >
              Cancel
            </button>

            <button
              :disabled="loading"
              @click="emit('delete')"
              class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Loader2
                v-if="loading"
                class="h-4 w-4 animate-spin"
              />

              <Trash2
                v-else
                class="h-4 w-4"
              />

              Delete Athlete
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>