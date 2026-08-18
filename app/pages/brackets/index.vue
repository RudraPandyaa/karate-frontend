<script setup lang="ts">
import { onMounted } from 'vue'
import { Calendar, MapPin, ChevronRight } from 'lucide-vue-next'
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'default',
  middleware: 'staff',
})

const { rows, pending, error, fetchAll } = useTournamentsData()

onMounted(() => {
  fetchAll()
})

function formatRange(start?: string, end?: string) {
  if (!start) return '—'
  const s = new Date(start)
  const e = end ? new Date(end) : null
  const opts: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }
  if (!e || Number.isNaN(e.getTime())) {
    return s.toLocaleDateString('en-GB', opts)
  }
  return `${s.toLocaleDateString('en-GB', opts)} – ${e.toLocaleDateString('en-GB', opts)}`
}
</script>

<template>
  <div class="space-y-6 p-6">
    <div>
      <h1 class="text-2xl font-bold text-foreground">
        Brackets
      </h1>
      <p class="mt-1 text-sm text-muted">
        Choose a tournament to view its category brackets
      </p>
    </div>

    <PageLoader
      v-if="pending"
      text="Loading tournaments..."
    />

    <div
      v-else-if="error"
      class="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400"
    >
      {{ error }}
    </div>

    <div
      v-else-if="rows.length === 0"
      class="rounded-2xl border border-dashed border-line bg-surface py-16 text-center text-muted"
    >
      No tournaments found.
    </div>

    <div
      v-else
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <NuxtLink
        v-for="t in rows"
        :key="t.id"
        :to="`/brackets/tournament/${t.id}`"
        class="group flex items-start justify-between rounded-2xl border border-line bg-panel p-5 transition hover:border-blue-500/40 hover:bg-surface-hover"
      >
        <div class="min-w-0 space-y-2">
          <p class="text-lg font-semibold text-foreground">
            {{ t.name }}
          </p>

          <p
            v-if="t.location"
            class="flex items-center gap-1.5 text-sm text-muted"
          >
            <MapPin class="h-3.5 w-3.5 shrink-0" />
            {{ t.location }}
          </p>

          <p class="flex items-center gap-1.5 text-sm text-muted">
            <Calendar class="h-3.5 w-3.5 shrink-0" />
            {{ formatRange(t.startDate, t.endDate) }}
          </p>

          <p class="text-xs text-muted">
            {{ t.categoriesCount ?? 0 }} categories
            · {{ t.athletesCount ?? 0 }} athletes
          </p>
        </div>

        <ChevronRight class="mt-1 h-5 w-5 shrink-0 text-muted group-hover:text-blue-400" />
      </NuxtLink>
    </div>
  </div>
</template>