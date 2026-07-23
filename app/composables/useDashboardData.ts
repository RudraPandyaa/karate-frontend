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
  redAthlete: { id: string; name: string; state?: string; country?: string } | null
  blueAthlete: { id: string; name: string; state?: string; country?: string } | null
  status: MatchStatus
  redScore: number
  blueScore: number
  timeRemaining: number
}

function toLiveSummary(raw: RawMatch): LiveMatchSummary {
  return {
    id: raw.id,
    tatami: { 
      id: raw.tatami?.id || '', 
      number: raw.tatami?.number ?? 0 
    },
    category: { name: raw.category?.name || 'Unknown' },
    round: raw.round,
    discipline: raw.category?.discipline ?? 'KUMITE',
    redAthlete: raw.redAthlete,
    blueAthlete: raw.blueAthlete,
    redScore: raw.redScore,
    blueScore: raw.blueScore,
    timeRemaining: raw.timeRemaining,
    status: raw.status,
  }
}

function toUpcomingRow(raw: RawMatch): UpcomingMatchRow {
  return {
    id: raw.id,
    matchNo: `#M-${raw.id.slice(-4).toUpperCase()}`,
    categoryName: raw.category?.name || 'Unknown',
    round: raw.round,
    tatamiNumber: raw.tatami?.number ?? 0,
    redAthlete: raw.redAthlete || { id: '', name: 'TBD', state: '', country: '' },
    blueAthlete: raw.blueAthlete || { id: '', name: 'TBD', state: '', country: '' },
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

      const scheduled = matches
        .filter(m => m.status === 'SCHEDULED')
        .slice(0, 4)
        .map(toUpcomingRow)

      const ongoing = tournaments.filter((t: any) => t.status === 'ONGOING')

      liveMatches.value = live
      upcomingMatches.value = scheduled

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