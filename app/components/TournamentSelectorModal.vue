<script setup lang="ts">
import { Search, X, Trophy, MapPin, CalendarDays, Loader2 } from 'lucide-vue-next'

interface Tournament {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  status: string
}

const props = defineProps<{
  modelValue: boolean
  selectedId?: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', tournamentId: string): void
}>()

const { api } = useApi()

const tournaments = ref<Tournament[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const search = ref('')

const filteredTournaments = computed(() => {
  const q = search.value.trim().toLowerCase()

  if (!q) return tournaments.value

  return tournaments.value.filter((t) => {
    return (
      t.name.toLowerCase().includes(q) ||
      t.location.toLowerCase().includes(q)
    )
  })
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

async function loadTournaments() {
  loading.value = true
  error.value = null

  try {
    tournaments.value = await api<Tournament[]>('/tournaments')
  } catch (err: any) {
    error.value =
      err?.data?.message ||
      err?.message ||
      'Unable to load tournaments.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      await loadTournaments()
    }
  },
)

function selectTournament(id: string) {
  emit('select', id)
}

function closeModal() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 p-4"
    >
      <div
        class="w-full max-w-2xl overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl"
      >
        <!-- Header -->

        <div
          class="flex items-center justify-between border-b border-line px-6 py-5"
        >
          <div class="flex items-center gap-3">
            <Trophy class="h-6 w-6 text-blue-500" />

            <div>
              <h2 class="text-xl font-bold">
                Select Tournament
              </h2>

              <p class="text-sm text-muted">
                Choose the active tournament
              </p>
            </div>
          </div>

          <button
            class="rounded-full p-2 hover:bg-surface"
            @click="closeModal"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Search -->

        <div class="border-b border-line p-5">
          <div class="relative">
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />

            <input
              v-model="search"
              type="text"
              placeholder="Search tournaments..."
              class="w-full rounded-xl border border-line bg-surface py-3 pl-10 pr-4 outline-none focus:border-blue-500"
            >
          </div>
        </div>

        <!-- Body -->

        <div class="max-h-[500px] overflow-y-auto">

          <!-- Loading -->

          <div
            v-if="loading"
            class="flex flex-col items-center justify-center py-14"
          >
            <Loader2 class="h-8 w-8 animate-spin text-blue-500" />

            <p class="mt-4 text-muted">
              Loading tournaments...
            </p>
          </div>

          <!-- Error -->

          <div
            v-else-if="error"
            class="p-8 text-center text-red-400"
          >
            {{ error }}
          </div>

          <!-- Empty -->

          <div
            v-else-if="filteredTournaments.length === 0"
            class="p-12 text-center"
          >
            <p class="text-muted">
              No tournaments found.
            </p>
          </div>

          <!-- Tournament List -->

          <button
            v-for="tournament in filteredTournaments"
            :key="tournament.id"
            class="flex w-full items-start justify-between border-b border-line px-6 py-5 text-left transition hover:bg-surface"
            :class="{
              'bg-blue-500/10 border-l-4 border-l-blue-500':
                selectedId === tournament.id,
            }"
            @click="selectTournament(tournament.id)"
          >
            <div class="space-y-2">

              <div class="font-semibold">
                {{ tournament.name }}
              </div>

              <div class="flex items-center gap-2 text-sm text-muted">
                <MapPin class="h-4 w-4" />
                {{ tournament.location }}
              </div>

              <div class="flex items-center gap-2 text-sm text-muted">
                <CalendarDays class="h-4 w-4" />

                {{ formatDate(tournament.startDate) }}

                -

                {{ formatDate(tournament.endDate) }}
              </div>

            </div>

            <span
              class="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400"
            >
              {{ tournament.status }}
            </span>
          </button>

        </div>

        <!-- Footer -->

        <div
          class="flex justify-end border-t border-line px-6 py-5"
        >
          <button
            class="rounded-xl border border-line px-5 py-2 hover:bg-surface"
            @click="closeModal"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>