<script setup lang="ts">
import type { Category } from '~/composables/useCategories'
import type { BracketMatch } from '~/composables/useBracket'
import { computed } from 'vue'
import CountryFlag from 'vue-country-flag-next'
import { COUNTRY_CODE_MAP } from '~/utils/countries'

const props = defineProps<{
  category: Category
  matches: BracketMatch[]
}>()

// Fixed card geometry
const MATCH_HEIGHT = 75 // px
const MATCH_GAP = 24 // px
const COLUMN_WIDTH = 280 // px
const COLUMN_GAP = 64 // px — wider gap gives the connector lines room to be visible
const BRONZE_GAP = 56 // px, vertical space between semifinal row and bronze row

const weightLabel = computed(() => {
  const { weightMin, weightMax } = props.category
  if (weightMin == null && weightMax == null) return null
  if (weightMax == null) return `+${weightMin}KG`
  if (weightMin == null) return `-${weightMax}KG`
  return `${weightMin}-${weightMax}KG`
})

interface PodiumEntry {
  name: string
  state: string
}

const podium = computed(() => {
  const finalMatch = props.matches.find(
    (m) =>
      (m.round === 'FINAL' || m.round === 'FINAL_MATCH') &&
      m.status === 'COMPLETED'
  )
  if (!finalMatch) return null

  const winner =
    finalMatch.winnerId === finalMatch.redAthlete?.id
      ? finalMatch.redAthlete
      : finalMatch.blueAthlete

  const runnerUp =
    finalMatch.winnerId === finalMatch.redAthlete?.id
      ? finalMatch.blueAthlete
      : finalMatch.redAthlete

  if (!winner || !runnerUp) return null

  let secondRunnerUp: PodiumEntry | null = null

  const bronzeMatch = props.matches.find(
    (m) => (m.round === 'BRONZE' || m.round === 'BRONZE_MEDAL') && m.status === 'COMPLETED'
  )

  if (bronzeMatch) {
    secondRunnerUp =
      bronzeMatch.winnerId === bronzeMatch.redAthlete?.id
        ? bronzeMatch.redAthlete ?? null
        : bronzeMatch.blueAthlete ?? null
  } else {
    const semiFinals = props.matches.filter(
      (m) =>
        (m.round === 'SEMI_FINAL' || m.round === 'SEMIFINAL') &&
        m.status === 'COMPLETED'
    )
    for (const semi of semiFinals) {
      const loser =
        semi.winnerId === semi.redAthlete?.id
          ? semi.blueAthlete
          : semi.redAthlete
      if (
        loser &&
        loser.id !== winner.id &&
        loser.id !== runnerUp.id
      ) {
        secondRunnerUp = loser
        break
      }
    }
  }

  return { winner, runnerUp, secondRunnerUp }
})

const ROUND_ORDER: Record<string, number> = {
  ROUND_1: 1, ROUND_2: 2, ROUND_3: 3,
  QUARTER_FINAL: 4, QUARTERFINAL: 4,
  SEMI_FINAL: 5, SEMIFINAL: 5,
  BRONZE_MEDAL: 6, BRONZE: 6, REPECHAGE: 6,
  FINAL: 7, FINAL_MATCH: 7,
}

const ROUND_LABELS: Record<string, string> = {
  ROUND_1: 'Round 1', ROUND_2: 'Round 2', ROUND_3: 'Round 3',
  QUARTER_FINAL: 'Quarter Final', QUARTERFINAL: 'Quarter Final',
  SEMI_FINAL: 'Semi Final', SEMIFINAL: 'Semi Final',
  BRONZE_MEDAL: 'Bronze Medal', BRONZE: 'Bronze',
  REPECHAGE: 'Repechage',
  FINAL: 'Final', FINAL_MATCH: 'Final',
}

interface RoundGroup {
  round: string
  label: string
  matches: BracketMatch[]
}

interface PoolGroup {
  pool: number | null
  label: string
  rounds: RoundGroup[]
}

const poolGroups = computed<PoolGroup[]>(() => {
  const byPool = new Map<number | null, BracketMatch[]>()
  for (const m of props.matches) {
    const key = m.pool ?? null
    if (!byPool.has(key)) byPool.set(key, [])
    byPool.get(key)!.push(m)
  }

  const pools = [...byPool.keys()].sort((a, b) => {
    if (a === null) return 1
    if (b === null) return -1
    return a - b
  })

  return pools.map((pool) => {
    const poolMatches = byPool.get(pool)!
    const byRound = new Map<string, BracketMatch[]>()

    for (const m of poolMatches) {
      if (!byRound.has(m.round)) byRound.set(m.round, [])
      byRound.get(m.round)!.push(m)
    }

    const rounds: RoundGroup[] = [...byRound.entries()]
      .sort((a, b) => (ROUND_ORDER[a[0]] ?? 99) - (ROUND_ORDER[b[0]] ?? 99))
      .map(([round, ms]) => ({
        round,
        label: ROUND_LABELS[round] ?? round,
        matches: [...ms].sort((a, b) => (a.bracketSlot ?? 0) - (b.bracketSlot ?? 0)),
      }))

    return {
      pool,
      label: pool === null ? 'Bracket' : `Pool ${pool}`,
      rounds,
    }
  })
})

function splitRounds(rounds: RoundGroup[]) {
  const mainRounds = rounds.filter((r) => r.round !== 'BRONZE_MEDAL' && r.round !== 'BRONZE')
  const bronzeRound = rounds.find((r) => r.round === 'BRONZE_MEDAL' || r.round === 'BRONZE') ?? null
  return { mainRounds, bronzeRound }
}

function matchNodeStyle(roundIndex: number, matchIndex: number) {
  const unit = MATCH_HEIGHT + MATCH_GAP
  const spacing = unit * Math.pow(2, roundIndex)
  const topOffset = (spacing - MATCH_HEIGHT) / 2
  const marginTop = matchIndex === 0 ? topOffset : spacing - MATCH_HEIGHT

  return {
    height: `${MATCH_HEIGHT}px`,
    marginTop: `${marginTop}px`,
  }
}

function getMatchCardCenterY(roundIndex: number, matchIndex: number) {
  const unit = MATCH_HEIGHT + MATCH_GAP
  const spacing = unit * Math.pow(2, roundIndex)
  const topOffset = (spacing - MATCH_HEIGHT) / 2
  return topOffset + matchIndex * spacing + MATCH_HEIGHT / 2
}

function bracketDimensions(rounds: RoundGroup[]) {
  const { mainRounds, bronzeRound } = splitRounds(rounds)
  const width = mainRounds.length * COLUMN_WIDTH + Math.max(0, mainRounds.length - 1) * COLUMN_GAP
  const round1Count = mainRounds[0]?.matches.length ?? 0
  const unit = MATCH_HEIGHT + MATCH_GAP
  const mainHeight = round1Count * unit
  const height = mainHeight + (bronzeRound ? BRONZE_GAP + MATCH_HEIGHT : 0)
  return { width, height, mainHeight }
}

function buildConnectorLines(rounds: RoundGroup[]) {
  const { mainRounds, bronzeRound } = splitRounds(rounds)
  const lines: Array<{ key: string; d: string }> = []
  const dims = bracketDimensions(rounds)

  mainRounds.forEach((roundGroup, roundIndex) => {
    const nextRoundGroup = mainRounds[roundIndex + 1]
    if (!nextRoundGroup) return

    const currentX = roundIndex * (COLUMN_WIDTH + COLUMN_GAP) + COLUMN_WIDTH
    const nextX = (roundIndex + 1) * (COLUMN_WIDTH + COLUMN_GAP)
    const junctionX = currentX + (nextX - currentX) / 2

    for (let matchIndex = 0; matchIndex < roundGroup.matches.length; matchIndex += 2) {
      const firstMatch = roundGroup.matches[matchIndex]
      const secondMatch = roundGroup.matches[matchIndex + 1]
      const targetMatch = nextRoundGroup.matches[Math.floor(matchIndex / 2)]

      if (!firstMatch || !secondMatch || !targetMatch) continue

      const firstY = getMatchCardCenterY(roundIndex, matchIndex)
      const secondY = getMatchCardCenterY(roundIndex, matchIndex + 1)
      const targetY = getMatchCardCenterY(roundIndex + 1, Math.floor(matchIndex / 2))
      const junctionY = (firstY + secondY) / 2

      lines.push({
        key: `${roundGroup.round}-${firstMatch.id}-stub`,
        d: `M ${currentX} ${firstY} H ${junctionX}`,
      })
      lines.push({
        key: `${roundGroup.round}-${secondMatch.id}-stub`,
        d: `M ${currentX} ${secondY} H ${junctionX}`,
      })
      lines.push({
        key: `${roundGroup.round}-${firstMatch.id}-${secondMatch.id}-connect`,
        d: `M ${junctionX} ${firstY} V ${secondY}`,
      })
      lines.push({
        key: `${roundGroup.round}-${targetMatch.id}-out`,
        d: `M ${junctionX} ${junctionY} H ${nextX} V ${targetY}`,
      })
    }
  })

  if (bronzeRound && mainRounds.length > 0) {
    const semifinalRound = mainRounds[mainRounds.length - 1]
    const semifinalRoundIndex = mainRounds.length - 1
    const columnX = semifinalRoundIndex * (COLUMN_WIDTH + COLUMN_GAP) + COLUMN_WIDTH / 2
    const junctionY = dims.mainHeight + BRONZE_GAP / 2
    const bronzeTopY = dims.mainHeight + BRONZE_GAP

    semifinalRound.matches.forEach((match, matchIndex) => {
      const y = getMatchCardCenterY(semifinalRoundIndex, matchIndex)
      lines.push({
        key: `${semifinalRound.round}-${match.id}-bronze-drop`,
        d: `M ${columnX} ${y} V ${junctionY}`,
      })
    })

    lines.push({
      key: 'bronze-merge',
      d: `M ${columnX} ${junctionY} V ${bronzeTopY}`,
    })
  }

  return lines
}

// ─── Athlete helpers ────────────────────────────────────────────────────────

function athleteName(
  a?: {
    fullName?: string
    firstName?: string
    lastName?: string
  } | null,
) {
  if (!a) return 'TBD'
  return (
    a.fullName ||
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    'Unknown'
  )
}

function athleteCountryCode(a?: { country?: string } | null): string | null {
  if (!a?.country) return null
  return COUNTRY_CODE_MAP[a.country.toUpperCase()] ?? null
}
</script>

<template>
  <div class="rounded-2xl border border-line bg-panel p-6">
    <!-- Category Header -->
    <div class="mb-6 border-b border-line pb-4">
      <h2 class="text-xl font-bold text-foreground">{{ category.name }}</h2>
      <p class="text-sm text-muted">
        {{ category.ageGroup }} · {{ category.gender }} · {{ category.discipline }}
        <span v-if="weightLabel"> · {{ weightLabel }}</span>
      </p>
    </div>

    <!-- Podium -->
    <div v-if="podium" class="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Winner -->
      <div class="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-yellow-400 mb-1">🥇 Winner</p>
        <div class="flex items-center gap-2 font-semibold text-foreground">
          <CountryFlag
            v-if="athleteCountryCode(podium.winner)"
            :country="athleteCountryCode(podium.winner)!"
            size="small"
          />
          <span>{{ athleteName(podium.winner) }}</span>
          <span v-if="podium.winner?.state" class="text-muted text-sm font-normal">
            ({{ podium.winner.state }})
          </span>
        </div>
      </div>

      <!-- Runner-up -->
      <div class="rounded-xl border border-line bg-surface p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-muted mb-1">🥈 Runner-up</p>
        <div class="flex items-center gap-2 font-semibold text-foreground">
          <CountryFlag
            v-if="athleteCountryCode(podium.runnerUp)"
            :country="athleteCountryCode(podium.runnerUp)!"
            size="small"
          />
          <span>{{ athleteName(podium.runnerUp) }}</span>
          <span v-if="podium.runnerUp?.state" class="text-muted text-sm font-normal">
            ({{ podium.runnerUp.state }})
          </span>
        </div>
      </div>

      <!-- 2nd Runner-up -->
      <div class="rounded-xl border border-orange-500/30 bg-orange-500/10 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-orange-400 mb-1">🥉 2nd Runner-up</p>
        <div v-if="podium.secondRunnerUp" class="flex items-center gap-2 font-semibold text-foreground">
          <CountryFlag
            v-if="athleteCountryCode(podium.secondRunnerUp)"
            :country="athleteCountryCode(podium.secondRunnerUp)!"
            size="small"
          />
          <span>{{ athleteName(podium.secondRunnerUp) }}</span>
          <span v-if="podium.secondRunnerUp?.state" class="text-muted text-sm font-normal">
            ({{ podium.secondRunnerUp.state }})
          </span>
        </div>
        <span v-else class="font-semibold text-foreground">—</span>
      </div>
    </div>

    <!-- No Matches -->
    <div v-if="matches.length === 0" class="py-12 text-center text-muted">
      No bracket generated yet for this category.
    </div>

    <!-- Bracket -->
    <div v-else class="space-y-10">
      <div v-for="pg in poolGroups" :key="pg.pool ?? 'final'">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-muted">
          {{ pg.label }}
        </h3>

        <div class="overflow-x-auto pb-6">
          <!-- Labels row -->
          <div class="flex" :style="{ columnGap: `${COLUMN_GAP}px` }">
            <div
              v-for="rg in splitRounds(pg.rounds).mainRounds"
              :key="`label-${rg.round}`"
              class="min-w-[280px] flex-shrink-0"
            >
              <p class="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                {{ rg.label }}
              </p>
            </div>
          </div>

          <div
            class="relative"
            :style="{
              width: `${bracketDimensions(pg.rounds).width}px`,
              height: `${bracketDimensions(pg.rounds).height}px`,
            }"
          >
            <svg
              class="pointer-events-none absolute left-0 top-0 z-0"
              :width="bracketDimensions(pg.rounds).width"
              :height="bracketDimensions(pg.rounds).height"
              :viewBox="`0 0 ${bracketDimensions(pg.rounds).width} ${bracketDimensions(pg.rounds).height}`"
            >
              <path
                v-for="line in buildConnectorLines(pg.rounds)"
                :key="line.key"
                :d="line.d"
                class="connector-path"
                stroke-width="2"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>

            <!-- Main Rounds -->
            <div class="relative z-10 flex" :style="{ columnGap: `${COLUMN_GAP}px` }">
              <div
                v-for="(rg, ri) in splitRounds(pg.rounds).mainRounds"
                :key="rg.round"
                class="min-w-[280px] flex-shrink-0"
              >
                <div class="relative">
                  <div
                    v-for="(m, mi) in rg.matches"
                    :key="m.id"
                    class="match-node relative rounded-xl border border-line bg-canvas p-3"
                    :style="matchNodeStyle(ri, mi)"
                  >
                    <!-- Red athlete -->
                    <div class="flex items-center justify-between text-sm">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <CountryFlag
                          v-if="athleteCountryCode(m.redAthlete)"
                          :country="athleteCountryCode(m.redAthlete)!"
                          size="small"
                          class="shrink-0"
                        />
                        <span
                          class="truncate text-foreground"
                          :class="{ 'font-semibold text-green-400': m.winnerId === m.redAthlete?.id }"
                        >
                          {{ athleteName(m.redAthlete) }}
                          <span v-if="m.redAthlete?.state" class="text-muted text-xs">
                            ({{ m.redAthlete.state }})
                          </span>
                        </span>
                      </div>
                      <span v-if="m.status === 'COMPLETED'" class="ml-2 text-muted shrink-0">
                        {{ m.redScore }}
                      </span>
                    </div>

                    <div class="my-1 border-t border-line" />

                    <!-- Blue athlete -->
                    <div class="flex items-center justify-between text-sm">
                      <div class="flex items-center gap-1.5 min-w-0">
                        <CountryFlag
                          v-if="athleteCountryCode(m.blueAthlete)"
                          :country="athleteCountryCode(m.blueAthlete)!"
                          size="small"
                          class="shrink-0"
                        />
                        <span
                          class="truncate text-foreground"
                          :class="{ 'font-semibold text-green-400': m.winnerId === m.blueAthlete?.id }"
                        >
                          {{ athleteName(m.blueAthlete) }}
                          <span v-if="m.blueAthlete?.state" class="text-muted text-xs">
                            ({{ m.blueAthlete.state }})
                          </span>
                        </span>
                      </div>
                      <span v-if="m.status === 'COMPLETED'" class="ml-2 text-muted shrink-0">
                        {{ m.blueScore }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bronze Medal -->
            <div
              v-if="splitRounds(pg.rounds).bronzeRound"
              class="absolute z-10"
              :style="{
                top: `${bracketDimensions(pg.rounds).mainHeight + BRONZE_GAP}px`,
                left: `${(splitRounds(pg.rounds).mainRounds.length - 1) * (COLUMN_WIDTH + COLUMN_GAP)}px`,
                width: `${COLUMN_WIDTH}px`,
              }"
            >
              <p class="mb-2 text-center text-xs font-medium uppercase tracking-wide text-muted">
                {{ splitRounds(pg.rounds).bronzeRound!.label }} (3rd place)
              </p>

              <div
                v-for="m in splitRounds(pg.rounds).bronzeRound!.matches"
                :key="m.id"
                class="rounded-xl border border-line bg-canvas p-3"
              >
                <!-- Red athlete -->
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <CountryFlag
                      v-if="athleteCountryCode(m.redAthlete)"
                      :country="athleteCountryCode(m.redAthlete)!"
                      size="small"
                      class="shrink-0"
                    />
                    <span
                      class="truncate text-foreground"
                      :class="{ 'font-semibold text-green-400': m.winnerId === m.redAthlete?.id }"
                    >
                      {{ athleteName(m.redAthlete) }}
                      <span v-if="m.redAthlete?.state" class="text-muted text-xs">
                        ({{ m.redAthlete.state }})
                      </span>
                    </span>
                  </div>
                  <span v-if="m.status === 'COMPLETED'" class="ml-2 text-muted shrink-0">
                    {{ m.redScore }}
                  </span>
                </div>

                <div class="my-1 border-t border-line" />

                <!-- Blue athlete -->
                <div class="flex items-center justify-between text-sm">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <CountryFlag
                      v-if="athleteCountryCode(m.blueAthlete)"
                      :country="athleteCountryCode(m.blueAthlete)!"
                      size="small"
                      class="shrink-0"
                    />
                    <span
                      class="truncate text-foreground"
                      :class="{ 'font-semibold text-green-400': m.winnerId === m.blueAthlete?.id }"
                    >
                      {{ athleteName(m.blueAthlete) }}
                      <span v-if="m.blueAthlete?.state" class="text-muted text-xs">
                        ({{ m.blueAthlete.state }})
                      </span>
                    </span>
                  </div>
                  <span v-if="m.status === 'COMPLETED'" class="ml-2 text-muted shrink-0">
                    {{ m.blueScore }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.match-node {
  position: relative;
  z-index: 1;
}
</style>