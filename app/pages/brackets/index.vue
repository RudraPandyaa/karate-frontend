<script setup lang="ts">
const { rows: categories, pending, fetchCategories } = useCategories()

onMounted(() => {
  fetchCategories()
})
</script>

<template>
  <div class="p-6">
    <h1 class="mb-6 text-2xl font-bold">Brackets</h1>

    <div v-if="pending" class="text-white/60">Loading categories...</div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <NuxtLink
        v-for="cat in categories"
        :key="cat.id"
        :to="`/brackets/${cat.id}`"
        class="rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600"
      >
        <p class="font-semibold">{{ cat.name }}</p>
        <p class="text-sm text-white/50">{{ cat._count?.athletes ?? 0 }} athletes</p>
      </NuxtLink>
    </div>
  </div>
</template>