<script setup lang="ts">
definePageMeta({
  layout: 'public',
})

import { athleteDisplayName } from '~/composables/useMatches'

const { matches, pending, error, fetchAll } = useMatches()

onMounted(fetchAll)

const statusColor = (status: string) => {
  if (status === 'IN_PROGRESS') return 'text-green-400'
  if (status === 'PAUSED') return 'text-yellow-400'
  if (status === 'COMPLETED') return 'text-blue-400'
  return 'text-muted'
}

/** ISO 3166-1 alpha-3 → alpha-2 for flagcdn (extend as needed) */
const alpha3ToAlpha2: Record<string, string> = {
  IND: 'in',
  USA: 'us',
  GBR: 'gb',
  JPN: 'jp',
  KOR: 'kr',
  CHN: 'cn',
  FRA: 'fr',
  GER: 'de',
  BRA: 'br',
  AUS: 'au',
  CAN: 'ca',
  ITA: 'it',
  ESP: 'es',
  NED: 'nl',
  TUR: 'tr',
  IRI: 'ir',
  EGY: 'eg',
  RSA: 'za',
  NZL: 'nz',
  THA: 'th',
}

function flagUrl(country?: string | null): string | null {
  if (!country) return null
  const code = country.toUpperCase().trim()
  const alpha2 = alpha3ToAlpha2[code] ?? (code.length === 2 ? code.toLowerCase() : null)
  if (!alpha2) return null
  return `https://flagcdn.com/20x15/${alpha2}.png`
}
</script>

<template>
  <div class="min-h-screen bg-canvas px-6 py-10">
    <div class="max-w-5xl mx-auto">
      <h1 class="text-3xl font-bold text-foreground mb-8">All Matches</h1>

      <div v-if="pending" class="text-foreground/60 text-center py-20">Loading matches...</div>
      <div v-else-if="error" class="text-red-400 text-center py-20">{{ error }}</div>
      <div v-else-if="matches.length === 0" class="text-foreground/60 text-center py-20">
        No matches found.
      </div>

      <div v-else class="space-y-3">
        <NuxtLink
          v-for="m in matches"
          :key="m.id"
          :to="`/live-scoring/${m.id}`"
          class="flex items-center justify-between rounded-xl border border-line bg-panel px-5 py-4 hover:border-primary/40 transition-colors"
        >
          <div>
            <p class="text-foreground font-semibold flex items-center gap-2 flex-wrap">
              <span class="inline-flex items-center gap-1.5">
                <img
                  v-if="flagUrl(m.redAthlete?.country)"
                  :src="flagUrl(m.redAthlete?.country)!"
                  :alt="m.redAthlete?.country || ''"
                  class="w-5 h-auto rounded-sm"
                  loading="lazy"
                />
                {{
                  m.redAthlete?.fullName
                    || [m.redAthlete?.firstName, m.redAthlete?.lastName].filter(Boolean).join(' ')
                    || 'TBD'
                }}
              </span>

              <span class="text-muted font-normal">vs</span>

              <span class="inline-flex items-center gap-1.5">
                <img
                  v-if="flagUrl(m.blueAthlete?.country)"
                  :src="flagUrl(m.blueAthlete?.country)!"
                  :alt="m.blueAthlete?.country || ''"
                  class="w-5 h-auto rounded-sm"
                  loading="lazy"
                />
                {{
                  m.blueAthlete?.fullName
                    || [m.blueAthlete?.firstName, m.blueAthlete?.lastName].filter(Boolean).join(' ')
                    || 'TBD'
                }}
              </span>
            </p>
            <p class="text-sm text-muted">
              {{ m.category?.name }} • {{ m.round }}
            </p>
          </div>
          <div class="text-right">
            <p class="font-mono text-foreground">{{ m.redScore }} - {{ m.blueScore }}</p>
            <p class="text-xs font-medium" :class="statusColor(m.status)">{{ m.status }}</p>
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>