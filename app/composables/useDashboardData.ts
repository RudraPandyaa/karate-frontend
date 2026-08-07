import type {
  DashboardStats,
  LiveMatchSummary,
  UpcomingMatchRow,
  MatchStatus,
  Discipline,
} from '~/types'

interface RawMatch {
  id: string
  category: { name: string; discipline?: Discipline } | null
  tatami: { number: number } | null
  round: string
  redAthlete: {
    id: string
    name?: string
    fullName?: string
    firstName?: string
    lastName?: string
    state?: string
    country?: string
  } | null
  blueAthlete: {
    id: string
    name?: string
    fullName?: string
    firstName?: string
    lastName?: string
    state?: string
    country?: string
  } | null
  status: MatchStatus
  redScore: number
  blueScore: number
  timeRemaining: number
}

function athleteLabel(a: any): { id: string; name: string; country: string } {
  if (!a) return { id: '', name: 'TBD', country: '' }

  const name =
    a.fullName ||
    a.name ||
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    'TBD'

  return {
    id: a.id || '',
    name,
    country: a.country || '',
  }
}

function toUpcomingRow(raw: RawMatch): UpcomingMatchRow {
  return {
    id: raw.id,
    matchNo: `#M-${raw.id.slice(-4).toUpperCase()}`,
    categoryName: raw.category?.name || 'Unknown',
    round: raw.round,
    tatamiNumber: raw.tatami?.number ?? 0,
    redAthlete: athleteLabel(raw.redAthlete),
    blueAthlete: athleteLabel(raw.blueAthlete),
  }
}

function toLiveSummary(raw: RawMatch): LiveMatchSummary {
  return {
    id: raw.id,
    tatami: {
      id: (raw.tatami as any)?.id || '',
      number: raw.tatami?.number ?? 0,
    },
    category: { name: raw.category?.name || 'Unknown' },
    round: raw.round,
    discipline: raw.category?.discipline ?? 'KUMITE',
    redAthlete: athleteLabel(raw.redAthlete),
    blueAthlete: athleteLabel(raw.blueAthlete),
    redScore: raw.redScore,
    blueScore: raw.blueScore,
    timeRemaining: raw.timeRemaining,
    status: raw.status,
  }
}

// ===================================================================

export function useDashboardData() {
  const { api } = useApi()

  const stats = ref<DashboardStats>({
    totalTournaments: 0,
    totalTournamentsDeltaPct: 0,
    activeTournamentsCount: 0,
    activeTournamentName: null,
    totalAthletes: 0,
    runningMatches: 0,
  })

  const liveMatches = ref<LiveMatchSummary[]>([])
  const upcomingMatches = ref<UpcomingMatchRow[]>([])
  const usingMockData = ref(false)
  const pending = ref(false)
  const error = ref<string | null>(null)

  const ROUND_ORDER = [
  'ROUND_1',
  'ROUND_2',
  'ROUND_3',
  'ROUND_OF_32',
  'ROUND_OF_16',
  'QUARTER_FINAL',
  'SEMI_FINAL',
  'FINAL',
  'BRONZE',
]

  async function fetchAll() {
    pending.value = true
    error.value = null

    try {
      const [matches, tournaments, athletes] = await Promise.all([
        api<RawMatch[]>('/matches'),
        api<any[]>('/tournaments'),
        api<any[]>('/athletes'),
      ])

      console.log('MATCHES RESPONSE:', matches)
      console.log('TOURNAMENTS RESPONSE:', tournaments)
      console.log('ATHLETES RESPONSE:', athletes)
      
      const live = matches
        .filter(m => m.status === 'IN_PROGRESS')
        .map(toLiveSummary)

      const playable = matches.filter(
        m =>
          m.status === 'SCHEDULED' &&
          m.redAthlete &&
          m.blueAthlete
      )

let scheduled: RawMatch[] = []

for (const round of ROUND_ORDER) {
  const roundMatches = playable.filter(m => m.round === round)

  if (roundMatches.length) {
    scheduled = roundMatches
    break
  }
}

upcomingMatches.value = scheduled
  .slice(0, 4)
  .map(toUpcomingRow)

      const ongoing = tournaments.filter((t: any) => t.status === 'ONGOING')

      liveMatches.value = live

      stats.value = {
        totalTournaments: tournaments.length,
        totalTournamentsDeltaPct: 12, // TODO: calculate delta if needed
        activeTournamentsCount: ongoing.length,
        activeTournamentName: ongoing[0]?.name ?? null,
        totalAthletes: athletes.length,
        runningMatches: live.length,
      }

      usingMockData.value = false
    } catch (e: any) {
      console.warn('[useDashboardData] API error, using fallback:', e.message)
      usingMockData.value = true
      error.value = e.message || 'Failed to load dashboard'
    } finally {
      pending.value = false
    }
  }

  return { 
    stats, 
    liveMatches, 
    upcomingMatches, 
    usingMockData, 
    pending, 
    error, 
    fetchAll 
  }
}