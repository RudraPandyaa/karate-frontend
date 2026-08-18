import type {
  LiveMatchSummary,
  UpcomingMatchRow,
  MatchStatus,
  Discipline,
} from '~/types'

interface RawMatch {
  id: string
  category: { name: string; discipline?: Discipline } | null
  tatami: { id?: string; number: number } | null
  round: string
  scheduledTime?: string | null
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

function athleteLabel(a: any): {
  id: string
  name: string
  country: string
  state: string
} {
  if (!a) {
    return { id: '', name: 'TBD', country: '', state: '' }
  }

  const name =
    a.fullName ||
    a.name ||
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    'TBD'

  return {
    id: a.id || '',
    name,
    country: a.country || '',
    state: a.state || '',
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
      id: raw.tatami?.id || '',
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

export function useDashboardData() {
  const { api } = useApi()

  const pending = ref(false)
  const usingMockData = ref(false)

  const stats = reactive({
    totalTournaments: 0,
    totalTournamentsDeltaPct: null as number | null,
    activeTournamentsCount: 0,
    activeTournamentName: null as string | null,
    totalAthletes: 0,
    runningMatches: 0,
  })

  const liveMatches = ref<LiveMatchSummary[]>([])
  const upcomingMatches = ref<UpcomingMatchRow[]>([])

  async function fetchAll() {
    pending.value = true
    usingMockData.value = false

    try {
      const [tournaments, athletes, matches] = await Promise.all([
        api<any[]>('/tournaments'),
        api<any[]>('/athletes'),
        api<RawMatch[]>('/matches'),
      ])

      const today = new Date()
      today.setHours(12, 0, 0, 0)

      const active = tournaments.filter((t) => {
        if (t.status === 'CANCELLED') return false
        const s = new Date(t.startDate)
        const e = new Date(t.endDate)
        if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false
        s.setHours(0, 0, 0, 0)
        e.setHours(23, 59, 59, 999)
        return today >= s && today <= e
      })

      stats.totalTournaments = tournaments.length
      stats.activeTournamentsCount = active.length
      stats.activeTournamentName =
        active.length === 1
          ? active[0].name
          : active.length > 1
            ? `${active.length} ongoing`
            : null
      stats.totalAthletes = athletes.length

      const running = matches.filter((m) =>
        ['IN_PROGRESS', 'PAUSED'].includes(m.status),
      )
      stats.runningMatches = running.length
      liveMatches.value = running.map(toLiveSummary)

      upcomingMatches.value = matches
        .filter(
          (m) =>
            m.status === 'SCHEDULED' &&
            m.redAthlete &&
            m.blueAthlete,
        )
        .sort((a, b) => {
          const ta = a.scheduledTime
            ? new Date(a.scheduledTime).getTime()
            : 0
          const tb = b.scheduledTime
            ? new Date(b.scheduledTime).getTime()
            : 0
          return ta - tb
        })
        .slice(0, 20)
        .map(toUpcomingRow)
    } catch (e) {
      console.error(e)
      usingMockData.value = true
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
    fetchAll,
  }
}