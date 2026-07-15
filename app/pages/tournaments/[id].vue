<script setup lang="ts">
import { Calendar, MapPin, Users, Trophy } from 'lucide-vue-next'

const route = useRoute()
const id = route.params.id as string

const { isStaff } = useAuth()

// Fetch tournament data
const { tournament, matches, athletes, categories, loading, refresh } = useTournamentDetail(id)

const activeTab = ref<'overview' | 'matches' | 'athletes' | 'categories' | 'dashboard'>('overview')

const tabs = [
  { id: 'overview', label: 'Overview' },
  { id: 'matches', label: 'Matches' },
  { id: 'athletes', label: 'Athletes' },
  { id: 'categories', label: 'Categories' },
]

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
</script>

<template>
  <div class="space-y-8 pb-12">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-20 text-muted">
      Loading tournament...
    </div>

    <!-- Tournament Header -->
    <div v-else class="rounded-3xl bg-gradient-to-br from-slate-900 to-zinc-950 p-8 text-white border border-line">
      <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 class="text-4xl font-bold">{{ tournament?.name }}</h1>
          <p class="mt-2 text-lg text-slate-300">{{ tournament?.subtitle }}</p>

          <div class="flex flex-wrap gap-x-6 gap-y-2 mt-5 text-sm">
            <div class="flex items-center gap-2">
              <MapPin class="w-5 h-5 text-slate-400" />
              {{ tournament?.location }}
            </div>
            <div class="flex items-center gap-2">
              <Calendar class="w-5 h-5 text-slate-400" />
              {{ formatDate(tournament?.startDate) }} — {{ formatDate(tournament?.endDate) }}
            </div>
          </div>
        </div>

        <div class="text-right">
          <StatusBadge :status="tournament?.status" size="lg" />
        </div>
      </div>
    </div>

    <!-- Tabs -->
    <div class="border-b border-line">
      <div class="flex items-center justify-between">
        <nav class="flex gap-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              activeTab === tab.id ? 'border-b-2 border-blue-500 text-foreground' : 'text-muted hover:text-foreground'
            ]"
            class="pb-4 text-sm font-medium transition"
          >
            {{ tab.label }}
          </button>

          <!-- Staff Only -->
          <button
            v-if="isStaff"
            @click="activeTab = 'dashboard'"
            :class="[
              activeTab === 'dashboard' ? 'border-b-2 border-emerald-500 text-emerald-400' : 'text-emerald-400 hover:text-emerald-300'
            ]"
            class="pb-4 text-sm font-medium transition flex items-center gap-1"
          >
            <Trophy class="w-4 h-4" />
            Staff Dashboard
          </button>
        </nav>

        <!-- Quick Staff Actions -->
        <div v-if="isStaff" class="flex gap-3">
            <button
                @click="() => {}"
                class="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                New Match
            </button>
        </div>
      </div>
    </div>

    <div class="min-h-[400px]">
    <!-- Overview -->
    <div v-if="activeTab === 'overview'">
        <TournamentOverview
        :tournament="tournament"
        :athletes-count="athletes.length"
        />
    </div>

    <!-- Matches -->
    <div v-else-if="activeTab === 'matches'" class="rounded-xl border border-line p-6">
        <h2 class="text-xl font-semibold">Matches</h2>
        <p class="mt-2">Total Matches: {{ matches.length }}</p>
    </div>

    <!-- Athletes -->
    <div v-else-if="activeTab === 'athletes'">
        <AthletesTable :athletes="athletes" />
    </div>

    <!-- Categories -->
    <div v-else-if="activeTab === 'categories'" class="rounded-xl border border-line p-6">
        <h2 class="text-xl font-semibold">Categories</h2>

        <ul class="mt-4 space-y-2">
        <li
            v-for="category in categories"
            :key="category.id"
        >
            {{ category.name }}
        </li>
        </ul>
    </div>

    <!-- Staff Dashboard -->
    <div v-else-if="activeTab === 'dashboard' && isStaff">
        <TournamentStaffDashboard
        :tournament="tournament"
        :matches="matches"
        />
    </div>
    </div>
  </div>
</template>