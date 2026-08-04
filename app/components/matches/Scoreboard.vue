<script setup lang="ts">
import type { LiveMatch } from '~/composables/useLiveMatch'

const props = defineProps<{
  match: LiveMatch
}>()

const safeTimeRemaining = computed(() =>
  Math.max(0, props.match.timeRemaining),
)

  const minutes = computed(() =>
    Math.floor(safeTimeRemaining.value / 60),
  )

  const seconds = computed(() =>
    safeTimeRemaining.value % 60,
  )

  const clock = computed(() => {
    const m = String(minutes.value).padStart(2, '0')
    const s = String(seconds.value).padStart(2, '0')

    return `${m}:${s}`
  })

const isLowTime = computed(() =>
  props.match.timeRemaining <= 15 &&
  props.match.status === 'IN_PROGRESS',
)

const statusLabel = computed(() => {
  switch (props.match.status) {
    case 'IN_PROGRESS':
      return 'LIVE'

    case 'PAUSED':
      return 'PAUSED'

    case 'COMPLETED':
      return 'FINISHED'

    case 'SCHEDULED':
      return 'READY'

    default:
      return props.match.status
  }
})

const statusClass = computed(() => {
  switch (props.match.status) {
    case 'IN_PROGRESS':
      return 'text-green-400'

    case 'PAUSED':
      return 'text-yellow-400'

    case 'COMPLETED':
      return 'text-red-400'

    default:
      return 'text-foreground/60'
  }
})

function getAthleteName(athlete?: any) {
  if (!athlete) return 'TBD'
  return (
    athlete.fullName ||
    athlete.name ||
    [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') ||
    'TBD'
  )
}

import countries from 'i18n-iso-countries'

function flagUrl(country?: string | null): string | null {
  if (!country) return null

  const raw = country.trim()
  let alpha2: string | undefined

  if (raw.length === 2) {
    // "IN", "US"
    alpha2 = raw.toUpperCase()
  } else if (raw.length === 3) {
    // "IND", "USA"
    alpha2 = countries.alpha3ToAlpha2(raw.toUpperCase())
  } else {
    // "India", "United States"
    alpha2 = countries.getAlpha2Code(raw, 'en') ?? undefined
  }

  if (!alpha2) return null
  return `https://flagcdn.com/24x18/${alpha2.toLowerCase()}.png`
}

function penaltyLabel(corner: 'RED' | 'BLUE') {
  const p = corner === 'RED' ? props.match.penalties?.red : props.match.penalties?.blue
  if (!p) return '—'
  const parts: string[] = []
  if (p.chui) parts.push(`C1×${p.chui}`)
  if (p.hansokuChui) parts.push('HC')
  if (p.hansoku) parts.push('H')
  return parts.length ? parts.join(' · ') : 'None'
}


const redBreakdown = computed(() => {
  const events = props.match.scoreEvents ?? []

  return {
    ippon: events.filter(
      event =>
        event.corner === 'RED' &&
        event.type === 'IPPON' &&
        !event.wasUndone,
    ).length,

    wazaAri: events.filter(
      event =>
        event.corner === 'RED' &&
        event.type === 'WAZA_ARI' &&
        !event.wasUndone,
    ).length,

    yuko: events.filter(
      event =>
        event.corner === 'RED' &&
        event.type === 'YUKO' &&
        !event.wasUndone,
    ).length,
  }
})

const blueBreakdown = computed(() => {
  const events = props.match.scoreEvents ?? []

  return {
    ippon: events.filter(
      event =>
        event.corner === 'BLUE' &&
        event.type === 'IPPON' &&
        !event.wasUndone,
    ).length,

    wazaAri: events.filter(
      event =>
        event.corner === 'BLUE' &&
        event.type === 'WAZA_ARI' &&
        !event.wasUndone,
    ).length,

    yuko: events.filter(
      event =>
        event.corner === 'BLUE' &&
        event.type === 'YUKO' &&
        !event.wasUndone,
    ).length,
  }
})

const winnerName = computed(() => {
  if (!props.match.winnerId) return null
  if (props.match.winnerId === props.match.redAthlete?.id) {
    return getAthleteName(props.match.redAthlete)
  }
  if (props.match.winnerId === props.match.blueAthlete?.id) {
    return getAthleteName(props.match.blueAthlete)
  }
  return null
})
</script>

<template>
  <div class="min-h-screen bg-[#07111f] text-white">

    <!-- TOP HEADER -->
    <header
      class="border-b border-white/10 bg-[#0b1728] px-4 py-4 sm:px-8"
    >
      <div
        class="mx-auto flex max-w-[1600px] items-center justify-between gap-4"
      >

        <!-- LIVE STATUS -->
        <div class="flex items-center gap-3">
          <span
            class="h-3 w-3 rounded-full"
            :class="
              match.status === 'IN_PROGRESS'
                ? 'animate-pulse bg-red-500'
                : match.status === 'PAUSED'
                  ? 'bg-yellow-400'
                  : match.status === 'COMPLETED'
                    ? 'bg-gray-400'
                    : 'bg-green-500'
            "
          />

          <span
            class="text-sm font-bold uppercase tracking-widest"
            :class="statusClass"
          >
            {{ statusLabel }}
          </span>
        </div>

        <!-- MATCH INFORMATION -->
        <div class="text-center">
          <p class="text-xs font-bold uppercase tracking-widest text-white/50">
            {{ match.round }}
          </p>

          <p class="mt-1 text-sm font-bold uppercase sm:text-base">
            {{ match.category?.name ?? 'KUMITE MATCH' }}
          </p>
        </div>

        <!-- MATCH ID -->
        <div class="text-right">
          <p class="text-xs uppercase tracking-widest text-white/40">TATAMI</p>
          <p class="font-mono text-sm font-bold">
            {{ match.tatami?.number ?? match.tatami?.name ?? '—' }}
          </p>
        </div>

      </div>
    </header>


    <!-- MAIN SCOREBOARD -->
    <main
      class="mx-auto flex min-h-[calc(100vh-73px)] max-w-[1600px] flex-col justify-center gap-5 px-4 py-5 sm:px-8"
    >

      <!-- TOP ATHLETE AREA -->
      <div
        class="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.15fr_1fr]"
      >

        <!-- RED ATHLETE -->
        <section
          class="relative overflow-hidden rounded-2xl border-4 border-red-600 bg-[#431923]"
        >

          <!-- Corner Header -->
          <div
            class="bg-red-600 px-5 py-3 text-center text-2xl font-black uppercase tracking-widest"
          >
            RED
          </div>

          <div class="p-5">

            <!-- Athlete -->
            <div class="flex items-center gap-4">

              <div
                class="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-red-400 bg-black/30"
              >
                <img
                  v-if="match.redAthlete?.photoUrl"
                  :src="match.redAthlete.photoUrl"
                  :alt="match.redAthlete.name"
                  class="h-full w-full object-cover"
                >

                <div
                  v-else
                  class="flex h-full w-full items-center justify-center text-2xl font-black text-red-300"
                >
                  R
                </div>
              </div>

              <div class="min-w-0">
                <p class="text-xs uppercase tracking-widest text-red-200/60">
                  Athlete
                </p>

                <h2 class="truncate text-xl font-black sm:text-2xl">
                  {{ getAthleteName(match.redAthlete) }}
                </h2>

                <p
                  v-if="match.redAthlete?.country"
                  class="mt-1 flex items-center gap-2 text-sm text-red-200/70"
                >
                  <img
                    v-if="flagUrl(match.redAthlete.country)"
                    :src="flagUrl(match.redAthlete.country)!"
                    :alt="match.redAthlete.country"
                    class="h-4 w-auto rounded-sm"
                    loading="lazy"
                  />
                </p>
              </div>

            </div>

            <!-- Score -->
            <div class="mt-5 text-center">

              <p
                class="font-mono text-8xl font-black leading-none tabular-nums sm:text-9xl"
              >
                {{ match.redScore }}
              </p>

              <p
                v-if="match.senshu === 'RED'"
                class="mt-3 inline-block rounded-full bg-red-500 px-4 py-1 text-xs font-black uppercase tracking-widest"
              >
                SENSHU
              </p>

            </div>

            <!-- Score Breakdown -->
            <div
              class="mt-5 grid grid-cols-3 gap-2 border-t border-red-300/20 pt-4 text-center"
            >

              <div>
                <p class="text-xs uppercase text-red-200/60">
                  Ippon
                </p>

                <p class="mt-1 text-2xl font-black">
                  {{ redBreakdown.ippon }}
                </p>

                <p class="text-xs text-red-200/50">
                  3 pts
                </p>
              </div>

              <div>
                <p class="text-xs uppercase text-red-200/60">
                  Waza-Ari
                </p>

                <p class="mt-1 text-2xl font-black">
                  {{ redBreakdown.wazaAri }}
                </p>

                <p class="text-xs text-red-200/50">
                  2 pts
                </p>
              </div>

              <div>
                <p class="text-xs uppercase text-red-200/60">
                  Yuko
                </p>

                <p class="mt-1 text-2xl font-black">
                  {{ redBreakdown.yuko }}
                </p>

                <p class="text-xs text-red-200/50">
                  1 pt
                </p>
              </div>

            </div>

          </div>

        </section>


        <!-- CENTER TIMER -->
        <section
          class="flex flex-col justify-center rounded-2xl border border-white/10 bg-[#101e31] p-5 text-center"
        >

          <p
            class="text-xs font-bold uppercase tracking-[0.3em] text-white/40"
          >
            TIME REMAINING
          </p>

          <div
            class="mt-3 font-mono text-7xl font-black leading-none tabular-nums sm:text-8xl xl:text-9xl"
            :class="
              isLowTime
                ? 'animate-pulse text-red-500'
                : 'text-white'
            "
          >
            {{ clock }}
          </div>

          <div class="mt-4 flex justify-center">
            <span
              class="rounded-full px-5 py-2 text-sm font-black uppercase tracking-widest"
              :class="
                match.status === 'IN_PROGRESS'
                  ? 'bg-green-500/20 text-green-400'
                  : match.status === 'PAUSED'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : match.status === 'COMPLETED'
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-white/10 text-white/60'
              "
            >
              {{ statusLabel }}
            </span>
          </div>

          <div
            class="mt-6 border-t border-white/10 pt-4"
          >
            <p class="text-xs uppercase tracking-widest text-white/40">
              ROUND
            </p>

            <p class="mt-1 text-lg font-black">
              {{ match.round }}
            </p>
          </div>

        </section>


        <!-- BLUE ATHLETE -->
        <section
          class="relative overflow-hidden rounded-2xl border-4 border-blue-600 bg-[#172b4b]"
        >

          <!-- Corner Header -->
          <div
            class="bg-blue-600 px-5 py-3 text-center text-2xl font-black uppercase tracking-widest"
          >
            BLUE
          </div>

          <div class="p-5">

            <!-- Athlete -->
            <div
              class="flex items-center justify-end gap-4 text-right"
            >

            <div class="min-w-0">
              <p class="text-xs uppercase tracking-widest text-blue-200/60">
                Athlete
              </p>

              <h2 class="truncate text-xl font-black sm:text-2xl">
                {{ getAthleteName(match.blueAthlete) }}
              </h2>

              <p
                v-if="match.blueAthlete?.country"
                class="mt-1 flex items-center justify-end gap-2 text-sm text-blue-200/70"
              >
                <img
                  v-if="flagUrl(match.blueAthlete.country)"
                  :src="flagUrl(match.blueAthlete.country)!"
                  :alt="match.blueAthlete.country"
                  class="h-4 w-auto rounded-sm"
                  loading="lazy"
                />
              </p>
            </div>

              <div
                class="h-20 w-20 shrink-0 overflow-hidden rounded-full border-4 border-blue-400 bg-black/30"
              >
                <img
                  v-if="match.blueAthlete?.photoUrl"
                  :src="match.blueAthlete.photoUrl"
                  :alt="match.blueAthlete.name"
                  class="h-full w-full object-cover"
                >

                <div
                  v-else
                  class="flex h-full w-full items-center justify-center text-2xl font-black text-blue-300"
                >
                  B
                </div>
              </div>

            </div>

            <!-- Score -->
            <div class="mt-5 text-center">

              <p
                class="font-mono text-8xl font-black leading-none tabular-nums sm:text-9xl"
              >
                {{ match.blueScore }}
              </p>

              <p
                v-if="match.senshu === 'BLUE'"
                class="mt-3 inline-block rounded-full bg-blue-500 px-4 py-1 text-xs font-black uppercase tracking-widest"
              >
                SENSHU
              </p>

            </div>

            <!-- Score Breakdown -->
            <div
              class="mt-5 grid grid-cols-3 gap-2 border-t border-blue-300/20 pt-4 text-center"
            >

              <div>
                <p class="text-xs uppercase text-blue-200/60">
                  Ippon
                </p>

                <p class="mt-1 text-2xl font-black">
                  {{ blueBreakdown.ippon }}
                </p>

                <p class="text-xs text-blue-200/50">
                  3 pts
                </p>
              </div>

              <div>
                <p class="text-xs uppercase text-blue-200/60">
                  Waza-Ari
                </p>

                <p class="mt-1 text-2xl font-black">
                  {{ blueBreakdown.wazaAri }}
                </p>

                <p class="text-xs text-blue-200/50">
                  2 pts
                </p>
              </div>

              <div>
                <p class="text-xs uppercase text-blue-200/60">
                  Yuko
                </p>

                <p class="mt-1 text-2xl font-black">
                  {{ blueBreakdown.yuko }}
                </p>

                <p class="text-xs text-blue-200/50">
                  1 pt
                </p>
              </div>

            </div>

          </div>

        </section>

      </div>


            <!-- BOTTOM INFORMATION -->
      <div class="grid grid-cols-1 gap-5 md:grid-cols-3">

        <!-- RED -->
        <div class="rounded-2xl border border-red-500/30 bg-red-950/30 p-5">
          <p class="text-xs font-bold uppercase tracking-widest text-red-300/60">
            RED CORNER
          </p>

          <div class="mt-3 flex items-center justify-between">
            <span class="text-sm text-white/60">Senshu</span>
            <span
              class="rounded px-3 py-1 text-xs font-black"
              :class="
                match.senshu === 'RED'
                  ? 'bg-red-500 text-white'
                  : 'bg-white/10 text-white/40'
              "
            >
              {{ match.senshu === 'RED' ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <span class="text-sm text-white/60">Penalties</span>
            <span class="text-xs font-bold text-red-300">
              {{ penaltyLabel('RED') }}
            </span>
          </div>
        </div>

        <!-- CENTER STATUS -->
        <div class="rounded-2xl border border-white/10 bg-[#101e31] p-5 text-center">
          <p class="text-xs font-bold uppercase tracking-widest text-white/40">
            MATCH STATUS
          </p>
          <p class="mt-2 text-xl font-black" :class="statusClass">
            {{ statusLabel }}
          </p>
        </div>

        <!-- BLUE -->
        <div class="rounded-2xl border border-blue-500/30 bg-blue-950/30 p-5">
          <p class="text-xs font-bold uppercase tracking-widest text-blue-300/60">
            BLUE CORNER
          </p>

          <div class="mt-3 flex items-center justify-between">
            <span class="text-sm text-white/60">Senshu</span>
            <span
              class="rounded px-3 py-1 text-xs font-black"
              :class="
                match.senshu === 'BLUE'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/40'
              "
            >
              {{ match.senshu === 'BLUE' ? 'ACTIVE' : 'INACTIVE' }}
            </span>
          </div>

          <div class="mt-3 flex items-center justify-between">
            <span class="text-sm text-white/60">Penalties</span>
            <span class="text-xs font-bold text-blue-300">
              {{ penaltyLabel('BLUE') }}
            </span>
          </div>
        </div>
      </div>

      <!-- COMPLETED MATCH RESULT -->
      <div
        v-if="match.status === 'COMPLETED'"
        class="rounded-2xl border border-yellow-500/40 bg-yellow-500/10 p-5 text-center"
      >

        <p
          class="text-xs font-bold uppercase tracking-widest text-yellow-300/70"
        >
          MATCH COMPLETE
        </p>

        <p
          v-if="winnerName"
          class="mt-2 text-2xl font-black text-yellow-300"
        >
          WINNER: {{ winnerName }}
        </p>

        <p
          v-if="match.resultType"
          class="mt-1 text-sm uppercase tracking-widest text-white/50"
        >
          {{ match.resultType }}
        </p>

      </div>

    </main>

  </div>
</template>