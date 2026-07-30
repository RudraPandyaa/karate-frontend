<script setup lang="ts">
import { X, CheckCircle2, Printer, User } from 'lucide-vue-next'
import { roleLabel, roleBadgeClass, formatPrintedAt } from '~/utils/badges'

const props = defineProps<{
  open: boolean
  badge?: any | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'mark-printed', badgeId: string): void
}>()

function handleMarkPrinted() {
  if (!props.badge) return
  emit('mark-printed', props.badge.id)
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-150"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open && badge"
        class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <div class="w-full max-w-md rounded-3xl border border-line bg-panel shadow-2xl">
          <!-- Header -->
          <div class="flex items-center justify-between border-b border-line px-6 py-5">
            <h2 class="text-xl font-bold text-foreground">Badge Preview</h2>
            <button @click="emit('close')" class="rounded-lg p-2 hover:bg-surface transition">
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Card -->
          <div class="p-6">
            <div class="rounded-2xl border border-line bg-surface p-6 flex flex-col items-center text-center gap-3">
              <div class="w-24 h-24 rounded-2xl overflow-hidden border border-line bg-canvas flex items-center justify-center">
                <img
                  v-if="badge.photoUrl"
                  :src="badge.photoUrl"
                  class="w-full h-full object-cover"
                />
                <User v-else class="w-10 h-10 text-muted" />
              </div>

              <div>
                <p class="text-lg font-bold text-foreground">{{ badge.name || '—' }}</p>
                <span
                  class="mt-1 inline-block rounded-lg border px-2.5 py-1 text-xs font-medium"
                  :class="roleBadgeClass(badge.role)"
                >
                  {{ roleLabel(badge.role) }}
                </span>
              </div>

              <p class="font-mono text-sm tracking-wider text-muted">{{ badge.badgeNumber }}</p>

              <div class="w-full border-t border-line pt-3 space-y-1 text-sm text-muted">
                <p v-if="badge.dojo"><span class="text-foreground">Dojo:</span> {{ badge.dojo }}</p>
                <p v-if="badge.coach"><span class="text-foreground">Coach:</span> {{ badge.coach }}</p>
              </div>

              <p class="text-xs text-muted">
                {{ badge.printedAt ? `Printed ${formatPrintedAt(badge.printedAt)}` : 'Not printed yet' }}
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-line px-6 py-5">
            <button
              class="rounded-xl border border-line px-5 py-2.5 hover:bg-surface transition"
              @click="emit('close')"
            >
              Close
            </button>
            <button
              v-if="!badge.printedAt"
              :disabled="loading"
              class="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
              @click="handleMarkPrinted"
            >
              <CheckCircle2 class="h-4 w-4" />
              Mark as Printed
            </button>
            <button
              v-else
              class="inline-flex items-center gap-2 rounded-xl bg-surface border border-line px-5 py-2.5 hover:bg-surface-hover transition"
              @click="window.print()"
            >
              <Printer class="h-4 w-4" />
              Print
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>