<script setup lang="ts">
const { tournaments, fetchTournaments } = useCategories()

const loading = ref(true)

onMounted(async () => {
  try {
    await fetchTournaments()
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="p-6">

    <div class="mb-8">
      <h1 class="text-3xl font-bold text-foreground">
        Tatami Management
      </h1>

      <p class="mt-2 text-muted">
        Select a tournament to manage its tatamis.
      </p>
    </div>

    <div
      v-if="loading"
      class="rounded-xl border border-line bg-panel p-10 text-center text-muted"
    >
      Loading tournaments...
    </div>

    <div
      v-else-if="tournaments.length === 0"
      class="rounded-xl border border-line bg-panel p-10 text-center text-muted"
    >
      No tournaments found.
    </div>

    <div
      v-else
      class="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
    >
      <NuxtLink
        v-for="tournament in tournaments"
        :key="tournament.id"
        :to="`/tatamis/${tournament.id}`"
        class="rounded-2xl border border-line bg-panel p-6 transition hover:border-blue-500 hover:bg-surface-hover"
      >
        <h2 class="text-xl font-semibold text-foreground">
          {{ tournament.name }}
        </h2>

        <p class="mt-3 text-sm text-muted">
          Click to manage tatamis
        </p>
      </NuxtLink>
    </div>

  </div>
</template>