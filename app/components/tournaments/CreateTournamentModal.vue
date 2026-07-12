<script setup lang="ts">
import { X, Loader2 } from 'lucide-vue-next'
import type { CreateTournamentPayload } from '~/types'

const emit = defineEmits<{
  close: []
  submit: [payload: CreateTournamentPayload]
}>()

defineProps<{ submitting?: boolean; submitError?: string | null }>()

const form = reactive<CreateTournamentPayload>({
  name: '',
  location: '',
  startDate: '',
  endDate: '',
  organizationId: '',
})

function handleSubmit() {
  emit('submit', { ...form })
}
</script>

<template>
  <div class="fixed inset-0 z-50 grid place-items-center bg-black/60 px-4" @click.self="emit('close')">
    <div class="w-full max-w-md rounded-2xl border border-line bg-surface shadow-card">
      <div class="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 class="text-base font-bold text-white">Create Tournament</h3>
        <button class="text-muted hover:text-white transition-colors" aria-label="Close" @click="emit('close')">
          <X class="h-5 w-5" />
        </button>
      </div>

      <form class="px-5 py-4 space-y-4" @submit.prevent="handleSubmit">
        <div>
          <label class="block text-xs font-medium text-muted mb-1.5" for="t-name">Name</label>
          <input
            id="t-name"
            v-model="form.name"
            required
            type="text"
            placeholder="WKF World Karate Championship"
            class="w-full rounded-lg bg-canvas border border-line px-3 py-2 text-sm text-white placeholder:text-muted/60 outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/40"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-muted mb-1.5" for="t-location">Location</label>
          <input
            id="t-location"
            v-model="form.location"
            required
            type="text"
            placeholder="Madrid, Spain"
            class="w-full rounded-lg bg-canvas border border-line px-3 py-2 text-sm text-white placeholder:text-muted/60 outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/40"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5" for="t-start">Start date</label>
            <input
              id="t-start"
              v-model="form.startDate"
              required
              type="date"
              class="w-full rounded-lg bg-canvas border border-line px-3 py-2 text-sm text-white outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/40"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5" for="t-end">End date</label>
            <input
              id="t-end"
              v-model="form.endDate"
              required
              type="date"
              class="w-full rounded-lg bg-canvas border border-line px-3 py-2 text-sm text-white outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/40"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs font-medium text-muted mb-1.5" for="t-org">
            Organization ID
            <span class="text-muted/60 font-normal">— temporary, replace with a picker once organizations API is confirmed</span>
          </label>
          <input
            id="t-org"
            v-model="form.organizationId"
            required
            type="text"
            placeholder="cly1a2b3c..."
            class="w-full rounded-lg bg-canvas border border-line px-3 py-2 text-sm text-white placeholder:text-muted/60 outline-none focus:border-blue-600/60 focus:ring-1 focus:ring-blue-600/40"
          />
        </div>

        <p v-if="submitError" class="rounded-lg border border-rose-600/30 bg-rose-600/10 px-3 py-2 text-xs text-rose-300">
          {{ submitError }}
        </p>

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            class="rounded-lg px-4 py-2 text-sm font-medium text-muted hover:text-white transition-colors"
            @click="emit('close')"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors disabled:opacity-60"
          >
            <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
            {{ submitting ? 'Creating…' : 'Create Tournament' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>