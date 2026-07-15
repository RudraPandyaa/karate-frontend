<script setup lang="ts">
import type { Tatami } from '~/composables/useTatami'
import CurrentMatch from '~/components/tatami/CurrentMatch.vue'
const props = defineProps<{
  tatami: Tatami
}>()

const emit = defineEmits<{
  edit: [tatami: Tatami]
  delete: [id: string]
}>()

const { getQueue } = useTatami()

const queue = ref<{
  current: any | null
  next: any[]
}>({
  current: null,
  next: [],
})

const loading = ref(true)

async function loadQueue() {
  loading.value = true

  try {
    queue.value = await getQueue(props.tatami.id)
  } catch (err) {
    console.error('Failed to load queue:', err)

    queue.value = {
      current: null,
      next: [],
    }
  } finally {
    loading.value = false
  }
}

onMounted(loadQueue)

watch(
  () => props.tatami.id,
  () => {
    loadQueue()
  }
)
</script>

<template>
  <div
    class="rounded-2xl border border-line bg-panel p-6 shadow-lg transition hover:border-line"
  >
    <!-- Header -->

    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-foreground">
          Tatami {{ tatami.number }}
        </h2>

        <p class="text-sm text-muted">
          {{ tatami.name || 'No Name' }}
        </p>
      </div>

      <div
        class="h-4 w-4 rounded-full"
        :class="
          queue.current
            ? 'bg-green-500'
            : 'bg-zinc-600'
        "
      />
    </div>

    <!-- Current Match -->

    <div class="mt-8">
      <h3
        class="mb-3 text-xs uppercase tracking-widest text-muted"
      >
        Current Match
      </h3>

      <CurrentMatch
        :match="queue.current"
        :loading="loading"
      />
    </div>

    <!-- Queue -->

    <div class="mt-8">
      <h3
        class="mb-3 text-xs uppercase tracking-widest text-muted"
      >
        Upcoming Matches
      </h3>

      <div
        v-if="loading"
        class="text-sm text-muted"
      >
        Loading...
      </div>

      <div
        v-else-if="queue.next.length === 0"
        class="text-sm text-muted"
      >
        No upcoming matches.
      </div>

      <div
        v-else
        class="space-y-3"
      >
        <div
          v-for="match in queue.next"
          :key="match.id"
          class="rounded-lg border border-line bg-canvas p-3"
        >
          <div class="font-medium text-foreground">
            {{ match.redAthlete?.name || 'TBD' }}
          </div>

          <div class="my-1 text-center text-xs text-muted">
            VS
          </div>

          <div class="font-medium text-foreground">
            {{ match.blueAthlete?.name || 'TBD' }}
          </div>

          <div v-if="match.category" class="mt-2 text-xs text-muted">
            {{ match.category.name }}
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->

    <div class="mt-8 grid grid-cols-3 gap-3">
      <NuxtLink
        v-if="queue.current"
        :to="`/scoring-control/${queue.current.id}`"
        class="rounded-xl bg-blue-600 py-3 text-center font-medium hover:bg-blue-500 text-white"
      >
        Score
      </NuxtLink>

      <button
        v-else
        disabled
        class="cursor-not-allowed rounded-xl bg-surface py-3 text-foreground opacity-50"
      >
        Score
      </button>

      <button
        @click="emit('edit', tatami)"
        class="rounded-xl bg-surface py-3 font-medium text-foreground hover:bg-surface-hover"
      >
        Edit
      </button>

      <button
        @click="emit('delete', tatami.id)"
        class="rounded-xl bg-red-700 py-3 font-medium hover:bg-red-600 text-white"
      >
        Delete
      </button>
    </div>
  </div>
</template>  {{ match.category.name }}
