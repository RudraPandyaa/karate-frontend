<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next'
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'default',
  middleware: 'staff',
})

const route = useRoute()
const categoryId = route.params.categoryId as string

const { isAdmin } = useAuth()
const {
  category,
  matches,
  pending,
  generating,
  error,
  fetchCategoryBracket,
  generateBracket,
  regenerateBracket,
} = useBracket()

onMounted(() => {
  fetchCategoryBracket(categoryId)
})

async function handleGenerate() {
  await generateBracket(categoryId)
}

async function handleRegenerate() {
  if (
    !confirm(
      'This will permanently delete the current bracket and all results for this category. Continue?',
    )
  ) {
    return
  }
  await regenerateBracket(categoryId)
}
</script>

<template>
  <div class="p-6">
    <PageLoader
      v-if="pending"
      text="Loading bracket..."
    />

    <div
      v-else-if="error"
      class="py-20 text-center text-red-400"
    >
      {{ error }}
    </div>

    <template v-else-if="category">
      <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <NuxtLink
            to="/brackets"
            class="text-sm text-muted hover:text-foreground"
          >
            ← All brackets
          </NuxtLink>
          <h1 class="mt-1 text-2xl font-bold text-foreground">
            {{ category.name }}
          </h1>
          <p class="text-sm text-muted">
            {{ category.tournament?.name }}
          </p>
        </div>

        <div class="flex gap-2">
          <button
            v-if="matches.length === 0"
            type="button"
            class="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-medium text-white hover:bg-green-500 disabled:opacity-50"
            :disabled="generating"
            @click="handleGenerate"
          >
            <Loader2
              v-if="generating"
              class="h-4 w-4 animate-spin"
            />
            {{ generating ? 'Generating...' : 'Generate Bracket' }}
          </button>

          <button
            v-else-if="isAdmin"
            type="button"
            class="inline-flex items-center gap-2 rounded-xl border border-red-500/40 px-5 py-2.5 font-medium text-red-400 hover:bg-red-500/10 disabled:opacity-50"
            :disabled="generating"
            @click="handleRegenerate"
          >
            <Loader2
              v-if="generating"
              class="h-4 w-4 animate-spin"
            />
            {{ generating ? 'Regenerating...' : 'Regenerate Bracket' }}
          </button>
        </div>
      </div>

      <BracketDrawSheet
        :category="category"
        :matches="matches"
      />
    </template>
  </div>
</template>