<script setup lang="ts">
defineProps<{
  categories: any[]
}>()

function formatDiscipline(discipline?: string) {
  if (!discipline) return '—'
  return discipline
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function weightLabel(category: any) {
  if (
    category.discipline === 'KATA' ||
    category.discipline === 'TEAM_KATA'
  ) {
    return null
  }

  if (category.weightMin == null && category.weightMax == null) {
    return 'Open weight'
  }

  if (category.weightMin == null) {
    return `-${category.weightMax} kg`
  }

  if (category.weightMax == null) {
    return `+${category.weightMin} kg`
  }

  return `${category.weightMin}–${category.weightMax} kg`
}
</script>

<template>
  <div class="rounded-3xl border border-line bg-surface">
    <div class="flex items-center justify-between border-b border-line px-5 py-4">
      <div>
        <h3 class="font-semibold text-foreground">My Categories</h3>
        <p class="text-sm text-muted">Categories you are enrolled in</p>
      </div>

      <NuxtLink
        to="/athletes/categories"
        class="text-sm font-medium text-blue-400 hover:text-blue-300"
      >
        View all
      </NuxtLink>
    </div>

    <div v-if="!categories?.length" class="px-5 py-10 text-center text-sm text-muted">
      No categories enrolled yet
    </div>

    <div v-else class="divide-y divide-line">
      <div
        v-for="category in categories"
        :key="category.id"
        class="px-5 py-4"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-medium text-foreground">
              {{ category.name }}
            </p>

            <p class="mt-1 text-sm text-muted">
              {{ formatDiscipline(category.discipline) }}
              <span v-if="category.ageGroup">
                · {{ category.ageGroup }}
              </span>
              <span v-if="weightLabel(category)">
                · {{ weightLabel(category) }}
              </span>
            </p>

            <p
              v-if="category.tournament?.name"
              class="mt-1 text-xs text-muted"
            >
              {{ category.tournament.name }}
            </p>
          </div>

          <div
            v-if="category.seed"
            class="shrink-0 rounded-lg bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-400"
          >
            Seed #{{ category.seed }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>