<script setup lang="ts">
import type { Tatami } from '~/composables/useTatami'

const props = defineProps<{
  tournamentId: string
  tatami: Tatami | null
  saving: boolean
  error: string | null
}>()

const emit = defineEmits<{
  saved: []
  close: []
  submit: [
    payload: {
      number: number
      name: string
    }
  ]
}>()

const isEdit = computed(() => !!props.tatami)

const form = ref({
  number: props.tatami?.number ?? 1,
  name: props.tatami?.name ?? '',
})

watch(
  () => props.tatami,
  (tatami) => {
    form.value = {
      number: tatami?.number ?? 1,
      name: tatami?.name ?? '',
    }
  },
  { immediate: true },
)

function onSubmit() {
  emit('submit', {
    number: form.value.number,
    name: form.value.name,
  })
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
  >
    <div
      class="w-full max-w-md rounded-2xl border border-line bg-panel shadow-2xl"
    >
      <!-- Header -->

      <div class="border-b border-line px-6 py-5">
        <h2 class="text-xl font-bold text-foreground">
          {{ isEdit ? 'Edit Tatami' : 'Create Tatami' }}
        </h2>

        <p class="mt-1 text-sm text-muted">
          {{
            isEdit
              ? 'Update tatami details'
              : 'Create a new tatami for this tournament'
          }}
        </p>
      </div>

      <!-- Form -->

      <form
        class="space-y-5 p-6"
        @submit.prevent="onSubmit"
      >
        <!-- Number -->

        <div>
          <label
            class="mb-2 block text-sm font-medium text-muted"
          >
            Tatami Number
          </label>

          <input
            v-model.number="form.number"
            type="number"
            min="1"
            required
            class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none transition focus:border-blue-500 text-foreground"
          />
        </div>

        <!-- Name -->

        <div>
          <label
            class="mb-2 block text-sm font-medium text-muted"
          >
            Tatami Name
          </label>

          <input
            v-model="form.name"
            type="text"
            placeholder="Tatami 1"
            class="w-full rounded-xl border border-line bg-canvas px-4 py-3 outline-none transition focus:border-blue-500 text-foreground"
          />
        </div>

        <!-- Error -->

        <div
          v-if="error"
          class="rounded-lg bg-red-500/10 p-3 text-sm text-red-400"
        >
          {{ error }}
        </div>

        <!-- Buttons -->

        <div class="flex gap-3 pt-2">
          <button
            type="button"
            @click="emit('close')"
            class="flex-1 rounded-xl bg-surface py-3 font-semibold transition hover:bg-surface-hover"
          >
            Cancel
          </button>

          <button
            type="submit"
            :disabled="saving"
            class="flex-1 rounded-xl bg-blue-600 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-white"
          >
            {{ saving ? 'Saving...' : isEdit ? 'Update' : 'Create' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>