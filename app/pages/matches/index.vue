<script setup lang="ts">
import PageLoader from '~/components/ui/PageLoader.vue'

definePageMeta({
  layout: 'public',
})

const { matches, pending, error, fetchAll } = useMatches()

onMounted(() => {
  fetchAll()
})

const searchQuery = ref('')
const statusFilter = ref<'ALL' | 'LIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL')
const tatamiFilter = ref<string>('ALL')

const decidedMatches = computed(() =>
  matches.value.filter((m) => m.redAthlete && m.blueAthlete),
)

function statusRank(status: string) {
  if (status === 'IN_PROGRESS') return 0
  if (status === 'PAUSED') return 1
  if (status === 'SCHEDULED') return 2
  return 3
}

const sortedMatches = computed(() =>
  [...decidedMatches.value].sort(
    (a, b) => statusRank(a.status) - statusRank(b.status),
  ),
)

const tatamiOptions = computed(() => {
  const nums = new Set<number>()
  for (const m of decidedMatches.value) {
    if (m.tatami?.number != null) nums.add(m.tatami.number)
  }
  return Array.from(nums).sort((a, b) => a - b)
})

function formatScheduledTime(value?: string | null) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const filteredMatches = computed(() => {
  let list = sortedMatches.value

  if (statusFilter.value === 'LIVE') {
    list = list.filter(
      (m) => m.status === 'IN_PROGRESS' || m.status === 'PAUSED',
    )
  } else if (statusFilter.value === 'SCHEDULED') {
    list = list.filter((m) => m.status === 'SCHEDULED')
  } else if (statusFilter.value === 'COMPLETED') {
    list = list.filter((m) => m.status === 'COMPLETED')
  }

  if (tatamiFilter.value === 'unassigned') {
    list = list.filter((m) => !m.tatami)
  } else if (tatamiFilter.value !== 'ALL') {
    list = list.filter(
      (m) => String(m.tatami?.number) === tatamiFilter.value,
    )
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return list

  return list.filter((m) => {
    const red = athleteName(m.redAthlete)
    const blue = athleteName(m.blueAthlete)
    const cat = m.category?.name || ''
    return (
      red.toLowerCase().includes(q) ||
      blue.toLowerCase().includes(q) ||
      cat.toLowerCase().includes(q)
    )
  })
})

function statusMeta(status: string) {
  if (status === 'IN_PROGRESS') {
    return {
      label: 'LIVE',
      dot: 'bg-green-500 animate-pulse',
      badge: 'bg-red-600 text-white',
    }
  }
  if (status === 'PAUSED') {
    return {
      label: 'PAUSED',
      dot: 'bg-yellow-400',
      badge: 'bg-yellow-500/90 text-black',
    }
  }
  if (status === 'COMPLETED') {
    return {
      label: 'FINISHED',
      dot: 'bg-slate-400',
      badge: 'bg-slate-600 text-white',
    }
  }
  return {
    label: 'SCHEDULED',
    dot: 'bg-slate-500',
    badge: 'bg-slate-700 text-white',
  }
}

const alpha3ToAlpha2: Record<string, string> = {
  IND: 'in',
  USA: 'us',
  GBR: 'gb',
  JPN: 'jp',
  KOR: 'kr',
  CHN: 'cn',
  FRA: 'fr',
  GER: 'de',
  DEU: 'de',
  BRA: 'br',
  AUS: 'au',
  CAN: 'ca',
  ITA: 'it',
  ESP: 'es',
  NED: 'nl',
  NPL: 'np',
  LKA: 'lk',
  BGD: 'bd',
  PAK: 'pk',
  TUR: 'tr',
  IRI: 'ir',
  IRN: 'ir',
  EGY: 'eg',
  RSA: 'za',
  NZL: 'nz',
  THA: 'th',
}

function flagUrl(country?: string | null): string | null {
  if (!country) return null
  const code = country.toUpperCase().trim()
  const alpha2 =
    alpha3ToAlpha2[code] ??
    (code.length === 2 ? code.toLowerCase() : null)
  if (!alpha2) return null
  return `https://flagcdn.com/24x18/${alpha2}.png`
}

function athleteName(a?: any) {
  if (!a) return 'TBD'
  return (
    a.fullName ||
    a.name ||
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}

function formatRound(round?: string) {
  if (!round) return ''
  return round
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 transition-colors duration-200 dark:bg-[#07111f]">
    <!-- Header -->
    <header class="border-b border-slate-200 bg-white px-6 py-4 dark:border-white/10 dark:bg-[#0b1728]">
      <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <h1 class="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white sm:text-2xl">
          All Matches
        </h1>

        <div class="relative max-w-md flex-1">
          <svg
            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search athletes, categories..."
            class="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 dark:border-white/10 dark:bg-[#101e31] dark:text-white dark:placeholder:text-white/40"
          />
        </div>
      </div>
    </header>

    <!-- Filters -->
    <div class="mx-auto max-w-6xl px-6 pt-5">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="item in [
              { key: 'ALL', label: 'All' },
              { key: 'LIVE', label: 'Live' },
              { key: 'SCHEDULED', label: 'Upcoming' },
              { key: 'COMPLETED', label: 'Finished' },
            ]"
            :key="item.key"
            type="button"
            class="rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition"
            :class="
              statusFilter === item.key
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-white/15 dark:text-white/60 dark:hover:bg-white/5'
            "
            @click="statusFilter = item.key as any"
          >
            {{ item.label }}
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs font-semibold uppercase text-slate-500 dark:text-white/40">
            Tatami
          </span>
          <select
            v-model="tatamiFilter"
            class="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 dark:border-white/10 dark:bg-[#101e31] dark:text-white"
          >
            <option value="ALL">All</option>
            <option
              v-for="n in tatamiOptions"
              :key="n"
              :value="String(n)"
            >
              Tatami {{ n }}
            </option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="mx-auto max-w-6xl px-6 py-8">
      <PageLoader
        v-if="pending"
        text="Loading matches..."
      />

      <div
        v-else-if="error"
        class="py-24 text-center text-red-500 dark:text-red-400"
      >
        {{ error }}
      </div>

      <div
        v-else-if="filteredMatches.length === 0"
        class="py-24 text-center"
      >
        <p class="text-lg font-medium text-slate-500 dark:text-white/60">
          No matches found.
        </p>
        <p class="mt-1 text-sm text-slate-400 dark:text-white/40">
          Try a different filter or search term.
        </p>
      </div>

      <div
        v-else
        class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        <NuxtLink
          v-for="m in filteredMatches"
          :key="m.id"
          :to="`/live-scoring/${m.id}`"
          class="group block overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all duration-150 hover:border-red-400/50 hover:shadow-lg dark:border-white/10 dark:bg-[#0e1c30] dark:hover:border-red-500/40"
        >
          <!-- Top -->
          <div class="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-white/10 dark:bg-[#101e31]">
            <span class="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-white/50">
              Tatami {{ m.tatami?.number ?? '—' }}
              ·
              {{ m.category?.name ?? formatRound(m.round) }}
            </span>
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
              :class="statusMeta(m.status).badge"
            >
              <span
                class="h-1.5 w-1.5 rounded-full"
                :class="statusMeta(m.status).dot"
              />
              {{ statusMeta(m.status).label }}
            </span>
          </div>

          <!-- Athletes -->
          <div class="grid grid-cols-2">
            <div class="flex flex-col items-center gap-1.5 border-r border-slate-200 bg-red-50/60 py-5 dark:border-white/10 dark:bg-red-950/20">
              <div class="h-12 w-12 overflow-hidden rounded-full border-2 border-red-500 bg-slate-200 dark:bg-black/30">
                <img
                  v-if="m.redAthlete?.photoUrl"
                  :src="m.redAthlete.photoUrl"
                  class="h-full w-full object-cover"
                >
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center font-black text-red-500"
                >
                  R
                </div>
              </div>
              <p class="flex max-w-[90%] items-center gap-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                <img
                  v-if="flagUrl(m.redAthlete?.country)"
                  :src="flagUrl(m.redAthlete?.country)!"
                  class="h-3 w-auto rounded-sm"
                >
                {{ athleteName(m.redAthlete) }}
              </p>
            </div>

            <div class="flex flex-col items-center gap-1.5 bg-blue-50/60 py-5 dark:bg-blue-950/20">
              <div class="h-12 w-12 overflow-hidden rounded-full border-2 border-blue-500 bg-slate-200 dark:bg-black/30">
                <img
                  v-if="m.blueAthlete?.photoUrl"
                  :src="m.blueAthlete.photoUrl"
                  class="h-full w-full object-cover"
                >
                <div
                  v-else
                  class="flex h-full w-full items-center justify-center font-black text-blue-500"
                >
                  B
                </div>
              </div>
              <p class="flex max-w-[90%] items-center gap-1 truncate text-sm font-bold text-slate-900 dark:text-white">
                <img
                  v-if="flagUrl(m.blueAthlete?.country)"
                  :src="flagUrl(m.blueAthlete?.country)!"
                  class="h-3 w-auto rounded-sm"
                >
                {{ athleteName(m.blueAthlete) }}
              </p>
            </div>
          </div>

          <!-- Score -->
          <div class="flex items-center justify-center gap-4 border-t border-slate-200 py-3 dark:border-white/10">
            <span class="font-mono text-3xl font-black text-red-600 dark:text-red-400">
              {{ m.redScore }}
            </span>
            <span class="text-xl text-slate-300 dark:text-white/20">–</span>
            <span class="font-mono text-3xl font-black text-blue-600 dark:text-blue-400">
              {{ m.blueScore }}
            </span>
          </div>

          <!-- Footer -->
          <div class="border-t border-slate-200 bg-slate-50 px-4 py-2 text-center text-xs font-medium text-slate-500 dark:border-white/10 dark:bg-[#0b1520] dark:text-white/50">
            {{ formatRound(m.round) }}
            <span v-if="formatScheduledTime((m as any).scheduledTime)">
              · {{ formatScheduledTime((m as any).scheduledTime) }}
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>