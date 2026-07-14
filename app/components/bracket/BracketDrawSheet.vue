<script setup lang="ts">
import type { Category } from '~/composables/useCategories'
import type { BracketMatch } from '~/composables/useBracket'

const props = defineProps<{
  category: Category
  matches: BracketMatch[]
}>()

const ROUND_ORDER: Record<string, number> = {
  ROUND_1: 1,
  ROUND_2: 2,
  ROUND_3: 3,
  QUARTER_FINAL: 4,
  QUARTERFINAL: 4,
  SEMI_FINAL: 5,
  SEMIFINAL: 5,
  REPECHAGE: 6,
  BRONZE: 7,
  FINAL: 8,
  FINAL_MATCH: 8,
}

const ROUND_LABELS: Record<string, string> = {
  ROUND_1: 'Round 1',
  ROUND_2: 'Round 2',
  ROUND_3: 'Round 3',
  QUARTER_FINAL: 'Quarter Final',
  QUARTERFINAL: 'Quarter Final',
  SEMI_FINAL: 'Semi Final',
  SEMIFINAL: 'Semi Final',
  REPECHAGE: 'Repechage',
  BRONZE: 'Bronze',
  FINAL: 'Final',
  FINAL_MATCH: 'Final',
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

const weightLabel = computed(() => {
  const { weightMin, weightMax } = props.category
  if (weightMin == null && weightMax == null) return null
  if (weightMax == null) return `+${weightMin}KG`
  if (weightMin == null) return `-${weightMax}KG`
  return `${weightMin}-${weightMax}KG`
})

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

function athleteLabel(a?: { name: string; state: string } | null) {
  if (!a) return 'BYE'
  return `${a.name} (${a.state})`
}
</script>

<template>
  <div class="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
    <!-- Category header -->
    <div class="mb-6 border-b border-zinc-800 pb-4">
      <h2 class="text-xl font-bold">{{ category.name }}</h2>
      <p class="text-sm text-white/60">
        {{ category.ageGroup }} · {{ category.gender }} · {{ category.discipline }}
        <span v-if="weightLabel"> · {{ weightLabel }}</span>
      </p>
    </div>

    <div v-if="matches.length === 0" class="py-12 text-center text-white/50">
      No bracket generated yet for this category.
    </div>

    <!-- Pools -->
    <div v-else class="space-y-10">
      <div v-for="pg in poolGroups" :key="pg.pool ?? 'final'">
        <h3 class="mb-3 text-sm font-semibold uppercase tracking-widest text-white/50">
          {{ pg.label }}
        </h3>

        <div class="flex gap-6 overflow-x-auto pb-2">
          <div v-for="rg in pg.rounds" :key="rg.round" class="min-w-[260px] flex-shrink-0">
            <p class="mb-2 text-xs font-medium uppercase tracking-wide text-white/40">
              {{ rg.label }}
            </p>

            <div class="space-y-3">
              <div
                v-for="m in rg.matches"
                :key="m.id"
                class="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
              >
                <div class="flex items-center justify-between text-sm">
                  <span
                    class="truncate"
                    :class="{ 'font-semibold text-green-400': m.winnerId === m.redAthlete?.id }"
                  >
                    {{ athleteLabel(m.redAthlete) }}
                  </span>
                  <span v-if="m.status === 'COMPLETED'" class="ml-2 text-white/60">{{ m.redScore }}</span>
                </div>
                <div class="my-1 border-t border-zinc-800" />
                <div class="flex items-center justify-between text-sm">
                  <span
                    class="truncate"
                    :class="{ 'font-semibold text-green-400': m.winnerId === m.blueAthlete?.id }"
                  >
                    {{ athleteLabel(m.blueAthlete) }}
                  </span>
                  <span v-if="m.status === 'COMPLETED'" class="ml-2 text-white/60">{{ m.blueScore }}</span>
                </div>

                <div v-if="m.tatami" class="mt-2 text-xs text-white/40">
                  Tatami {{ m.tatami.number }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>