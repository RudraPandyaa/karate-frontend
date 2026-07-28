<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { X } from 'lucide-vue-next'
import { useApi } from '~/composables/useApi'
import { useMatches } from '~/composables/useMatches'
import type { Match } from '~/types'

const props = defineProps<{
  match: Match | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved'): void
}>()

const { api } = useApi()
const { updateMatch } = useMatches()

const loading = ref(false)
const saving = ref(false)
const error = ref('')

const referees = ref<any[]>([])
const scorekeepers = ref<any[]>([])

const form = reactive({
  refereeId: '',
  scorekeeperId: '',
})

async function loadStaff() {
  loading.value = true

  try {
    console.log(referees.value)
    console.log(scorekeepers.value)
    referees.value = await api('/users?role=REFEREE')
    scorekeepers.value = await api('/users?role=SCOREKEEPER')   

    form.refereeId = props.match?.referee?.id || ''
    form.scorekeeperId = props.match?.scorekeeper?.id || ''
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load staff'
  } finally {
    loading.value = false
  }
}

onMounted(loadStaff)

async function save() {
  if (!props.match) return

  saving.value = true
  error.value = ''

  try {
    await updateMatch(props.match.id, {
      refereeId: form.refereeId,
      scorekeeperId: form.scorekeeperId,
    })

    emit('saved')
    emit('close')
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to assign officials'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
    <div class="w-full max-w-lg rounded-3xl border border-line bg-panel shadow-2xl">

      <!-- Header -->
      <div class="flex items-center justify-between border-b border-line px-6 py-5">
        <div>
          <h2 class="text-xl font-bold">
            Assign Officials
          </h2>

          <p class="text-sm text-muted mt-1">
            {{ match?.redAthlete?.name }}
            vs
            {{ match?.blueAthlete?.name }}
          </p>
        </div>

        <button
          class="rounded-full p-2 hover:bg-surface"
          @click="emit('close')"
        >
          <X class="w-5 h-5"/>
        </button>
      </div>

      <!-- Body -->
      <div class="p-6 space-y-5">

        <div
          v-if="error"
          class="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-400"
        >
          {{ error }}
        </div>

        <div v-if="loading" class="text-muted">
          Loading staff...
        </div>

        <template v-else>

          <div>
            <label class="block mb-2 text-sm font-medium">
              Referee
            </label>

            <select
              v-model="form.refereeId"
              class="w-full rounded-xl border border-line bg-surface px-4 py-3"
            >
              <option value="">
                Select referee
              </option>

              <option
                v-for="user in referees"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }}
              </option>

            </select>
          </div>

          <div>
            <label class="block mb-2 text-sm font-medium">
              Scorekeeper
            </label>

            <select
              v-model="form.scorekeeperId"
              class="w-full rounded-xl border border-line bg-surface px-4 py-3"
            >
              <option value="">
                Select scorekeeper
              </option>

              <option
                v-for="user in scorekeepers"
                :key="user.id"
                :value="user.id"
              >
                {{ user.name }}
              </option>

            </select>
          </div>

        </template>

      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-3 border-t border-line px-6 py-5">

        <button
          class="rounded-xl border border-line px-5 py-2"
          @click="emit('close')"
        >
          Cancel
        </button>

        <button
          :disabled="saving"
          class="rounded-xl bg-blue-600 px-5 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          @click="save"
        >
          {{ saving ? 'Saving...' : 'Save' }}
        </button>

      </div>

    </div>
  </div>
</template>