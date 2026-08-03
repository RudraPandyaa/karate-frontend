<script setup lang="ts">
const route = useRoute()
const categoryId = route.params.categoryId as string

const { isAdmin } = useAuth()
const { category, matches, pending, generating, error, fetchCategoryBracket, generateBracket, regenerateBracket } = useBracket()

onMounted(() => {
  fetchCategoryBracket(categoryId)
})

async function handleGenerate() {
  await generateBracket(categoryId)
}

async function handleRegenerate() {
  if (!confirm('This will permanently delete the current bracket and all results for this category. Continue?')) return
  await regenerateBracket(categoryId)
}
</script>

<template>
  <div class="p-6">
    <div v-if="pending" class="py-20 text-center text-muted">Loading bracket...</div>

    <div v-else-if="error" class="py-20 text-center text-red-400">{{ error }}</div>

    <template v-else-if="category">
      <!-- No bracket yet: show Generate -->
      <div v-if="matches.length === 0" class="mb-4 flex justify-end">
        <button
          @click="handleGenerate"
          :disabled="generating"
          class="rounded-xl bg-green-600 px-5 py-2.5 font-medium hover:bg-green-500 disabled:opacity-50 text-white"
        >
          {{ generating ? 'Generating...' : 'Generate Bracket' }}
        </button>
      </div>

      <!-- Bracket exists: show Regenerate, admin-only -->
      <div v-else-if="isAdmin" class="mb-4 flex justify-end">
        <button
          @click="handleRegenerate"
          :disabled="generating"
          class="rounded-xl border border-red-500/40 text-red-400 px-5 py-2.5 font-medium hover:bg-red-500/10 disabled:opacity-50"
        >
          {{ generating ? 'Regenerating...' : 'Regenerate Bracket' }}
        </button>
      </div>

      <BracketDrawSheet :category="category" :matches="matches" />
    </template>
  </div>
</template>