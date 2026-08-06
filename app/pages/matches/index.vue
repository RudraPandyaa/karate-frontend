<script setup lang="ts">
definePageMeta({
  layout: 'public',
})

import { athleteDisplayName } from '~/composables/useMatches'

const { matches, pending, error, fetchAll } = useMatches()

onMounted(fetchAll)

const searchQuery = ref('')

// Only matches where BOTH athletes are actually assigned — drop TBD placeholders
const decidedMatches = computed(() =>
  matches.value.filter((m) => m.redAthlete && m.blueAthlete),
)

// Sort priority: live (IN_PROGRESS/PAUSED) first, then scheduled — completed last
function statusRank(status: string) {
  if (status === 'IN_PROGRESS') return 0
  if (status === 'PAUSED') return 1
  if (status === 'SCHEDULED') return 2
  return 3 // COMPLETED / anything else
}

const sortedMatches = computed(() =>
  [...decidedMatches.value].sort((a, b) => statusRank(a.status) - statusRank(b.status)),
)

const filteredMatches = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return sortedMatches.value
  return sortedMatches.value.filter((m) => {
    const red = athleteName(m.redAthlete)
    const blue = athleteName(m.blueAthlete)
    const cat = m.category?.name || ''
    return red.toLowerCase().includes(q) || blue.toLowerCase().includes(q) || cat.toLowerCase().includes(q)
  })
})

const statusMeta = (status: string) => {
  if (status === 'IN_PROGRESS') return { label: 'LIVE', dot: 'bg-green-500 animate-pulse', badge: 'bg-red-600 text-white' }
  if (status === 'PAUSED') return { label: 'PAUSED', dot: 'bg-yellow-400', badge: 'bg-yellow-500/90 text-black' }
  if (status === 'COMPLETED') return { label: 'FINISHED', dot: 'bg-slate-400', badge: 'bg-slate-600 text-white' }
  return { label: 'SCHEDULED', dot: 'bg-slate-500', badge: 'bg-slate-700 text-white' }
}

const alpha3ToAlpha2: Record<string, string> = {
  IND: 'in', USA: 'us', GBR: 'gb', JPN: 'jp', KOR: 'kr', CHN: 'cn', FRA: 'fr',
  GER: 'de', BRA: 'br', AUS: 'au', CAN: 'ca', ITA: 'it', ESP: 'es', NED: 'nl',
  TUR: 'tr', IRI: 'ir', EGY: 'eg', RSA: 'za', NZL: 'nz', THA: 'th',
}

function flagUrl(country?: string | null): string | null {
  if (!country) return null
  const code = country.toUpperCase().trim()
  const alpha2 = alpha3ToAlpha2[code] ?? (code.length === 2 ? code.toLowerCase() : null)
  if (!alpha2) return null
  return `https://flagcdn.com/24x18/${alpha2}.png`
}

function athleteName(a?: any) {
  if (!a) return 'TBD'
  return a.fullName || [a.firstName, a.lastName].filter(Boolean).join(' ') || 'TBD'
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 dark:bg-[#07111f] transition-colors duration-200">

    <!-- Page header (theme toggle lives in your global AppTopbar, not duplicated here) -->
    <header class="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#0b1728] px-6 py-4">
      <div class="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <h1 class="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
          All Matches
        </h1>

        <div class="relative flex-1 max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search athletes, categories..."
            class="w-full rounded-lg border border-slate-300 dark:border-white/10 bg-slate-50 dark:bg-[#101e31] pl-9 pr-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/40"
          />
        </div>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-6 py-8">

      <div v-if="pending" class="text-slate-500 dark:text-white/60 text-center py-24">
        Loading matches...
      </div>

      <div v-else-if="error" class="text-red-500 dark:text-red-400 text-center py-24">
        {{ error }}
      </div>

      <div v-else-if="filteredMatches.length === 0" class="text-center py-24">
        <p class="text-slate-500 dark:text-white/60 text-lg font-medium">No matches found.</p>
        <p class="text-slate-400 dark:text-white/40 text-sm mt-1">Try a different search term.</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <NuxtLink
          v-for="m in filteredMatches"
          :key="m.id"
          :to="`/live-scoring/${m.id}`"
          class="group block rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0e1c30] hover:border-red-400/50 dark:hover:border-red-500/40 hover:shadow-lg transition-all duration-150"
        >
          <div class="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-[#101e31] border-b border-slate-200 dark:border-white/10">
            <span class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/50">
              Tatami {{ m.tatami?.number ?? '—' }} • {{ m.category?.name ?? m.round }}
            </span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
              :class="statusMeta(m.status).badge"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta(m.status).dot" />
              {{ statusMeta(m.status).label }}
            </span>
          </div>

          <div class="grid grid-cols-2">
            <div class="flex flex-col items-center gap-1.5 py-5 bg-red-50/60 dark:bg-red-950/20 border-r border-slate-200 dark:border-white/10">
              <div class="h-12 w-12 rounded-full border-2 border-red-500 overflow-hidden bg-slate-200 dark:bg-black/30">
                <img v-if="m.redAthlete?.photoUrl" :src="m.redAthlete.photoUrl" class="h-full w-full object-cover" />
                <div v-else class="h-full w-full flex items-center justify-center text-red-500 font-black">R</div>
              </div>
              <p class="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[90%] flex items-center gap-1">
                <img v-if="flagUrl(m.redAthlete?.country)" :src="flagUrl(m.redAthlete?.country)!" class="h-3 w-auto rounded-sm" />
                {{ athleteName(m.redAthlete) }}
              </p>
            </div>

            <div class="flex flex-col items-center gap-1.5 py-5 bg-blue-50/60 dark:bg-blue-950/20">
              <div class="h-12 w-12 rounded-full border-2 border-blue-500 overflow-hidden bg-slate-200 dark:bg-black/30">
                <img v-if="m.blueAthlete?.photoUrl" :src="m.blueAthlete.photoUrl" class="h-full w-full object-cover" />
                <div v-else class="h-full w-full flex items-center justify-center text-blue-500 font-black">B</div>
              </div>
              <p class="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[90%] flex items-center gap-1">
                <img v-if="flagUrl(m.blueAthlete?.country)" :src="flagUrl(m.blueAthlete?.country)!" class="h-3 w-auto rounded-sm" />
                {{ athleteName(m.blueAthlete) }}
              </p>
            </div>
          </div>

          <div class="flex items-center justify-center gap-4 py-3 border-t border-slate-200 dark:border-white/10">
            <span class="font-mono text-3xl font-black text-red-600 dark:text-red-400">{{ m.redScore }}</span>
            <span class="text-slate-300 dark:text-white/20 text-xl">–</span>
            <span class="font-mono text-3xl font-black text-blue-600 dark:text-blue-400">{{ m.blueScore }}</span>
          </div>

          <div class="px-4 py-2 bg-slate-50 dark:bg-[#0b1520] text-center text-xs font-medium text-slate-500 dark:text-white/50 border-t border-slate-200 dark:border-white/10">
            {{ m.round }}
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>