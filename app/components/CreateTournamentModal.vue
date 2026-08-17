<script setup lang="ts">
import { X } from 'lucide-vue-next'
import type { CreateTournamentPayload } from '~/types'

const props = defineProps<{
  submitting: boolean
  submitError?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: CreateTournamentPayload): void
}>()

const { api } = useApi()

const organizations = ref<any[]>([])
const loadingOrganizations = ref(false)

const form = reactive<CreateTournamentPayload>({
  name: '',
  location: '',
  startDate: '',
  endDate: '',
  organizationId: '',
})

async function loadOrganizations() {
  loadingOrganizations.value = true
  try {
    organizations.value = await api('/organizations')
  } catch (err) {
    console.error(err)
  } finally {
    loadingOrganizations.value = false
  }
}

onMounted(loadOrganizations)

function submit() {
  if (
    !form.name ||
    !form.location ||
    !form.startDate ||
    !form.endDate ||
    !form.organizationId
  ) {
    return
  }

  emit('submit', { ...form })
}
</script>

<template>
  <!-- Teleport is the key fix -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      @click.self="emit('close')"
    >
      <div
        class="w-full max-w-2xl rounded-3xl border border-line bg-panel shadow-2xl"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between border-b border-line px-8 py-6"
        >
          <h2 class="text-2xl font-bold text-foreground">
            Create Tournament
          </h2>

          <button
            class="rounded-full p-2 hover:bg-surface text-foreground"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Body -->
        <div class="space-y-6 p-8">
          <div
            v-if="submitError"
            class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {{ submitError }}
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-foreground">
              Tournament Name
            </label>
            <input
              v-model="form.name"
              class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              placeholder="WKF World Championship"
            >
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-foreground">
              Location
            </label>
            <input
              v-model="form.location"
              class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              placeholder="Delhi, India"
            >
          </div>

          <div class="grid grid-cols-2 gap-5">
            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">
                Start Date
              </label>
              <input
                v-model="form.startDate"
                type="date"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              >
            </div>

            <div>
              <label class="mb-2 block text-sm font-medium text-foreground">
                End Date
              </label>
              <input
                v-model="form.endDate"
                type="date"
                class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
              >
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-medium text-foreground">
              Organization
            </label>
            <select
              v-model="form.organizationId"
              class="w-full rounded-xl border border-line bg-surface px-4 py-3 outline-none focus:border-blue-600 text-foreground"
            >
              <option value="">
                Select Organization
              </option>
              <option
                v-for="org in organizations"
                :key="org.id"
                :value="org.id"
              >
                {{ org.name }}
              </option>
            </select>
            <p
              v-if="!loadingOrganizations && organizations.length === 0"
              class="mt-2 text-sm text-amber-400"
            >
              No organizations found.
              <NuxtLink
                to="/organizations"
                class="underline hover:text-amber-300"
                @click="emit('close')"
              >
                Create one first
              </NuxtLink>
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex justify-end gap-3 border-t border-line px-8 py-6"
        >
          <button
            class="rounded-xl border border-line px-6 py-3 hover:bg-surface text-foreground"
            @click="emit('close')"
          >
            Cancel
          </button>

          <button
            :disabled="submitting"
            class="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            @click="submit"
          >
            {{ submitting ? 'Creating...' : 'Create Tournament' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>