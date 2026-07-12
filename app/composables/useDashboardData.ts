import type {
  DashboardStats,
  LiveMatchSummary,
  UpcomingMatchRow,
  MatchStatus,
  Discipline,
  Athlete,
  Tournament,
} from '~/types'

// ---- RAW API SHAPE -----------------------------------------------------
// Confirmed against matches.service.ts — findAll() includes category,
// redAthlete, blueAthlete, and tatami, so these are always present
// (never just foreign key columns).
interface RawMatch {
  id: string
  categoryId: string
  category?: { name: string; discipline?: Discipline }
  tatamiId: string | null
  tatami?: { number: number }
  round: string
  redAthleteId: string | null
  redAthlete?: { id: string; name: string; state: string; country: string }
  blueAthleteId: string | null
  blueAthlete?: { id: string; name: string; state: string; country: string }
  status: MatchStatus
  redScore: number
  blueScore: number
  timeRemaining: number
}

function toLiveSummary(raw: RawMatch): LiveMatchSummary {
  return {
    id: raw.id,
    tatami: { id: raw.tatamiId ?? '', number: raw.tatami?.number ?? 0 },
    category: { name: raw.category?.name ?? raw.categoryId },
    round: raw.round,
    discipline: raw.category?.discipline ?? 'KUMITE',
    redAthlete: raw.redAthlete ?? null,
    blueAthlete: raw.blueAthlete ?? null,
    redScore: raw.redScore,
    blueScore: raw.blueScore,
    timeRemaining: raw.timeRemaining,
    status: raw.status,
  }
}

function toUpcomingRow(raw: RawMatch, index: number): UpcomingMatchRow {
  return {
    id: raw.id,
    matchNo: `#M-${raw.id.slice(-3).toUpperCase()}`, // TODO: swap for a real match number field if you add one
    categoryName: raw.category?.name ?? raw.categoryId,
    round: raw.round,
    tatamiNumber: raw.tatami?.number ?? 0,
    redAthlete: raw.redAthlete ?? { id: '', name: 'TBD', state: '', country: '' },
    blueAthlete: raw.blueAthlete ?? { id: '', name: 'TBD', state: '', country: '' },
  }
}

// ---- MOCK DATA -------------------------------------------------------
// Used as a fallback so the dashboard renders correctly before the real
// endpoints are wired up. Shape matches what the components expect —
// once your controllers are confirmed, delete this block and the
// try/catch fallbacks below.

const MOCK_STATS: DashboardStats = {
  totalTournaments: 124,
  totalTournamentsDeltaPct: 12,
  activeTournamentName: 'Madrid Open 2024',
  totalAthletes: 3842,
  runningMatches: 4,
}

const MOCK_LIVE_MATCHES: LiveMatchSummary[] = [
  {
    id: 'lm1',
    tatami: { id: 't1', number: 1 },
    category: { name: 'Senior Male -75kg' },
    round: 'QUARTER FINAL',
    discipline: 'KUMITE',
    redAthlete: { id: 'a1', name: 'R. Sanchez', state: '', country: 'ESP' },
    blueAthlete: { id: 'a2', name: 'H. Tanaka', state: '', country: 'JPN' },
    redScore: 3,
    blueScore: 1,
    timeRemaining: 131,
    status: 'IN_PROGRESS',
  },
  {
    id: 'lm2',
    tatami: { id: 't2', number: 2 },
    category: { name: 'U21 Female +68kg' },
    round: 'WAITING FOR START',
    discipline: 'KUMITE',
    redAthlete: { id: 'a3', name: 'L. Dubois', state: '', country: 'FRA' },
    blueAthlete: { id: 'a4', name: 'E. Rossi', state: '', country: 'ITA' },
    redScore: 0,
    blueScore: 0,
    timeRemaining: 180,
    status: 'SCHEDULED',
  },
  {
    id: 'lm3',
    tatami: { id: 't3', number: 3 },
    category: { name: 'Kata Male Senior' },
    round: 'ROUND 3',
    discipline: 'KATA',
    redAthlete: { id: 'a5', name: 'M. Kosei', state: '', country: 'JPN' },
    blueAthlete: { id: 'a6', name: 'G. Hernandez', state: '', country: 'MEX' },
    redScore: 0,
    blueScore: 0,
    redKataScore: 24.6,
    blueKataScore: 25.2,
    timeRemaining: 62,
    status: 'IN_PROGRESS',
  },
  {
    id: 'lm4',
    tatami: { id: 't4', number: 4 },
    category: { name: 'Senior Female -61kg' },
    round: 'SEMI FINAL',
    discipline: 'KUMITE',
    redAthlete: { id: 'a7', name: 'S. Aghayev', state: '', country: 'AZE' },
    blueAthlete: { id: 'a8', name: 'K. Arania', state: '', country: 'GEO' },
    redScore: 2,
    blueScore: 4,
    timeRemaining: 42,
    status: 'IN_PROGRESS',
  },
]

const MOCK_UPCOMING: UpcomingMatchRow[] = [
  {
    id: 'um1',
    matchNo: '#M-142',
    categoryName: 'Senior Male -84kg',
    round: 'Pool B - Final',
    tatamiNumber: 1,
    redAthlete: { id: 'b1', name: 'M. Petrov', state: '', country: 'BUL' },
    blueAthlete: { id: 'b2', name: 'J. Doe', state: '', country: 'USA' },
  },
  {
    id: 'um2',
    matchNo: '#M-143',
    categoryName: 'Female Kata Junior',
    round: 'Elimination R1',
    tatamiNumber: 2,
    redAthlete: { id: 'b3', name: 'A. Yamada', state: '', country: 'JPN' },
    blueAthlete: { id: 'b4', name: 'C. Lopez', state: '', country: 'ESP' },
  },
  {
    id: 'um3',
    matchNo: '#M-144',
    categoryName: 'Senior Female -61kg',
    round: 'Bronze Medal',
    tatamiNumber: 4,
    redAthlete: { id: 'b5', name: 'S. Prekovic', state: '', country: 'SRB' },
    blueAthlete: { id: 'b6', name: 'A. Lotfy', state: '', country: 'EGY' },
  },
  {
    id: 'um4',
    matchNo: '#M-145',
    categoryName: 'Senior Male +84kg',
    round: 'Final',
    tatamiNumber: 1,
    redAthlete: { id: 'b7', name: 'U. Ugur', state: '', country: 'TUR' },
    blueAthlete: { id: 'b8', name: 'S. Ganjzadeh', state: '', country: 'IRI' },
  },
]

// ---- COMPOSABLE --------------------------------------------------------

export function useDashboardData() {
  const { api } = useApi()

  const stats = ref<DashboardStats>(MOCK_STATS)
  const liveMatches = ref<LiveMatchSummary[]>(MOCK_LIVE_MATCHES)
  const upcomingMatches = ref<UpcomingMatchRow[]>(MOCK_UPCOMING)
  const usingMockData = ref(true)
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    pending.value = true
    error.value = null
    try {
      // None of these three routes take query params or have a dedicated
      // stats/count endpoint yet, so we fetch full lists and derive
      // everything client-side. Fine for now — worth asking for a
      // GET /tournaments/stats-style endpoint later if the athletes list
      // grows large, since we're pulling the whole table just to count it.
      const [allMatches, allTournaments, allAthletes] = await Promise.all([
        api<RawMatch[]>('/matches'),
        api<Tournament[]>('/tournaments'),
        api<Athlete[]>('/athletes'),
      ])

      const live = allMatches.filter((m) => m.status === 'IN_PROGRESS').map(toLiveSummary)
      const scheduled = allMatches
        .filter((m) => m.status === 'SCHEDULED')
        .slice(0, 4)
        .map(toUpcomingRow)

      const activeTournament = allTournaments.find((t) => t.status === 'ONGOING') ?? null

      liveMatches.value = live
      upcomingMatches.value = scheduled
      stats.value = {
        totalTournaments: allTournaments.length,
        activeTournamentName: activeTournament?.name ?? null,
        totalAthletes: allAthletes.length,
        runningMatches: live.length,
      }
      usingMockData.value = false
    } catch (e) {
      // Backend not reachable yet, or endpoint doesn't exist — fall back to
      // mock data so the UI stays fully browsable during development.
      usingMockData.value = true
      error.value = e instanceof Error ? e.message : 'Failed to load dashboard data'
      console.warn('[useDashboardData] falling back to mock data:', error.value)
    } finally {
      pending.value = false
    }
  }

  return { stats, liveMatches, upcomingMatches, usingMockData, pending, error, fetchAll }
}