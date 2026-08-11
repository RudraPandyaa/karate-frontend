<script setup lang="ts">
import PageLoader from '~/components/ui/PageLoader.vue'
const { rows: categories, pending, fetchCategories } = useCategories()

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="p-6">
    <h1 class="mb-6 text-2xl font-bold text-foreground">Brackets</h1>

    <PageLoader v-if="pending" text="Loading your brackets..." />

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="cat in categories"
        :key="cat.id"
        :to="`/brackets/${cat.id}`"
        class="rounded-xl border border-line bg-panel p-4 hover:border-line"
      >
        <p class="font-semibold text-foreground">{{ cat.name }}</p>
        <p class="text-sm text-foreground">{{ cat._count?.athletes ?? 0 }} athletes</p>
      </NuxtLink>
    </div>
  </div>
</template>