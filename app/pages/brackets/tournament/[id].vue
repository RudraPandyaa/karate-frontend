<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'default',
  middleware: 'staff',
})

const route = useRoute()
const tournamentId = route.params.id as string

const { rows: categories, pending, fetchCategories } = useCategories()
const { rows: tournaments, fetchAll: fetchTournaments } = useTournamentsData()

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchTournaments()])
})

const tournament = computed(() =>
  tournaments.value.find((t) => t.id === tournamentId),
)

const tournamentCategories = computed(() =>
  categories.value.filter(
    (c) => (c.tournamentId || c.tournament?.id) === tournamentId,
  ),
)

function formatRange(start?: string, end?: string) {
  if (!start) return ''
  const s = new Date(start)
  const e = end ? new Date(end) : null
  const opts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }
  if (!e) return s.toLocaleDateString('en-GB', opts)
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', opts)}`
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <NuxtLink
        to="/brackets"
        class="text-sm text-muted hover:text-foreground"
      >
        ← All tournaments
      </NuxtLink>

      <h1 class="mt-2 text-2xl font-bold text-foreground">
        {{ tournament?.name || 'Tournament' }}
      </h1>
      <p
        v-if="tournament"
        class="mt-1 text-sm text-muted"
      >
        {{ formatRange(tournament.startDate, tournament.endDate) }}
        <span v-if="tournament.location"> · {{ tournament.location }}</span>
      </p>
      <p class="mt-1 text-sm text-muted">
        Select a category to open its bracket
      </p>
    </div>

    <PageLoader
      v-if="pending"
      text="Loading categories..."
    />

    <div
      v-else-if="tournamentCategories.length === 0"
      class="rounded-2xl border border-dashed border-line bg-surface py-16 text-center text-muted"
    >
      No categories in this tournament.
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
    >
      <NuxtLink
        v-for="cat in tournamentCategories"
        :key="cat.id"
        :to="`/brackets/${cat.id}`"
        class="group flex items-center justify-between rounded-xl border border-line bg-panel p-4 transition hover:border-blue-500/40 hover:bg-surface-hover"
      >
        <div class="min-w-0">
          <p class="font-semibold text-foreground">
            {{ cat.name }}
          </p>
          <p class="mt-1 text-sm text-muted">
            {{ cat.ageGroup }} · {{ cat.gender }} ·
            {{ cat.discipline?.replaceAll('_', ' ') }}
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ cat._count?.athletes ?? 0 }} athletes
            · {{ cat._count?.matches ?? 0 }} matches
          </p>
        </div>
        <ChevronRight class="h-5 w-5 shrink-0 text-muted group-hover:text-blue-400" />
      </NuxtLink>
    </div>
  </div>
</template>