<script setup lang="ts">
import { Users, Trophy, Scale, User, Target, ArrowLeft } from 'lucide-vue-next'
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'default',
  middleware: 'admin',
})

const route = useRoute()
const id = route.params.id as string

const category = ref<any>(null)
const athletes = ref<any[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const { api } = useApi()

async function fetchCategory() {
  loading.value = true
  error.value = null
  athletes.value = []

  try {
    const catData = await api(`/categories/${id}`)
    category.value = catData
    // unwrap CategoryAthlete[] -> Athlete[]
    athletes.value = (catData.athletes ?? []).map((ca: any) => ca.athlete)
  } catch (err: any) {
    console.error(err)
    error.value = err?.data?.message || 'Failed to load category'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCategory)

function goBack() {
  if (window.history.length > 1) {
    navigateTo(-1)
  } else {
    navigateTo('/categories')
  }
}

function weightText(cat: any) {
  if (!cat) return '—'
  if (cat.weightMin || cat.weightMax) {
    return `${cat.weightMin || 0} – ${cat.weightMax || '∞'} kg`
  }
  return 'Open'
}
</script>

<template>
  <div class="space-y-8 pb-12 relative min-h-[70vh]">
    <PageLoader v-if="loading" text="Loading category..." />

    <div v-else-if="error" class="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-400">
      {{ error }}
    </div>

    <div v-else-if="category" class="space-y-8">
      <!-- Header -->
      <div class="flex items-start justify-between gap-4">
        <div>
          <button
            class="flex items-center gap-2 text-sm text-muted hover:text-foreground mb-4 transition"
            @click="goBack"
          >
            <ArrowLeft class="h-4 w-4" />
            Back
          </button>

          <h1 class="text-3xl font-bold text-foreground">{{ category.name }}</h1>
          <p class="mt-1 text-muted">
            {{ category.ageGroup || '—' }} · {{ category.gender || '—' }} · {{ category.discipline || '—' }}
          </p>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-2xl border border-line bg-surface p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-emerald-500/10 p-2.5">
              <Users class="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ athletes.length }}</p>
              <p class="text-sm text-muted">Athletes</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-line bg-surface p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-blue-500/10 p-2.5">
              <Scale class="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ weightText(category) }}</p>
              <p class="text-sm text-muted">Weight Category</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-line bg-surface p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-amber-500/10 p-2.5">
              <User class="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ category.gender || '—' }}</p>
              <p class="text-sm text-muted">Gender</p>
            </div>
          </div>
        </div>

        <div class="rounded-2xl border border-line bg-surface p-5">
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-purple-500/10 p-2.5">
              <Target class="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p class="text-2xl font-bold">{{ category.discipline || '—' }}</p>
              <p class="text-sm text-muted">Discipline</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Details -->
      <div class="rounded-2xl border border-line bg-surface p-6">
        <h2 class="text-lg font-semibold mb-4">Category Details</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p class="text-muted">Age Group</p>
            <p class="font-medium">{{ category.ageGroup || '—' }}</p>
          </div>
          <div>
            <p class="text-muted">Gender</p>
            <p class="font-medium">{{ category.gender || '—' }}</p>
          </div>
          <div>
            <p class="text-muted">Discipline</p>
            <p class="font-medium">{{ category.discipline || '—' }}</p>
          </div>
          <div>
            <p class="text-muted">Weight Range</p>
            <p class="font-medium">{{ weightText(category) }}</p>
          </div>
        </div>
      </div>

      <!-- Athletes list -->
      <div class="rounded-2xl border border-line bg-surface overflow-hidden">
        <div class="px-6 py-4 border-b border-line flex items-center justify-between">
          <h2 class="text-lg font-semibold">Athletes in this Category</h2>
          <span class="text-sm text-muted">{{ athletes.length }} athlete{{ athletes.length !== 1 ? 's' : '' }}</span>
        </div>

        <div v-if="athletes.length === 0" class="py-16 text-center text-muted">
          No athletes enrolled in this category yet.
        </div>

        <div v-else class="divide-y divide-line">
          <div
            v-for="athlete in athletes"
            :key="athlete.id"
            class="px-6 py-4 flex items-center justify-between hover:bg-surface-hover cursor-pointer transition"
            @click="navigateTo(`/athletes/${athlete.id}`)"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-canvas border border-line flex items-center justify-center text-sm font-semibold text-muted">
                {{ (athlete.fullName || athlete.firstName || '?').charAt(0) }}
              </div>
              <div>
                <p class="font-medium">
                  {{ athlete.fullName || [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') }}
                </p>
                <p class="text-xs text-muted">{{ athlete.country || '' }}</p>
              </div>
            </div>
            <span class="text-sm text-blue-400">View →</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>