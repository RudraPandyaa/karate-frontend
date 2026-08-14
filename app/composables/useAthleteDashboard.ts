import { useApi } from '~/composables/useApi'

export interface AthleteDashboardMatch {
  id: string
  status: string
  round: string
  redScore: number
  blueScore: number
  timeRemaining: number
  winnerId?: string | null

  redAthlete?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    country?: string | null
    countryCode?: string | null
    photoUrl?: string | null
  } | null

  blueAthlete?: {
    id: string
    firstName?: string | null
    lastName?: string | null
    fullName?: string | null
    country?: string | null
    countryCode?: string | null
    photoUrl?: string | null
  } | null

  category?: {
    id: string
    name: string
    tournament?: {
      id: string
      name: string
    }
  } | null

  tatami?: {
    id: string
    number: number
    name?: string | null
  } | null
}

export interface AthleteDashboard {
  athlete: any
  categories: any[]
  stats: {
    matches: number
    wins: number
    losses: number
    winRate: number
    pointsScored: number
    pointsConceded: number
  }
  liveMatches: AthleteDashboardMatch[]
  upcomingMatches: AthleteDashboardMatch[]
  recentMatches: AthleteDashboardMatch[]
  history: any[]
}

export function useAthleteDashboard() {
  const { api } = useApi()

  // Shared across layout + all athlete pages
  const dashboard = useState<AthleteDashboard | null>(
    'athlete-dashboard',
    () => null,
  )
  const pending = useState<boolean>('athlete-dashboard-pending', () => false)
  const error = useState<string | null>('athlete-dashboard-error', () => null)

  // Avoid overlapping polls
  const fetching = useState<boolean>('athlete-dashboard-fetching', () => false)

  async function fetchDashboard(tournamentId?: string) {
    if (fetching.value) return

    fetching.value = true
    // Only show full pending on first load (no data yet)
    if (!dashboard.value) {
      pending.value = true
    }
    error.value = null

    try {
      dashboard.value = await api<AthleteDashboard>(
        '/athletes/me/dashboard',
        {
          query: tournamentId ? { tournamentId } : undefined,
        },
      )
    } catch (err: any) {
      error.value =
        err?.data?.message ||
        err?.message ||
        'Unable to load athlete dashboard'
    } finally {
      pending.value = false
      fetching.value = false
    }
  }

  return {
    dashboard,
    pending,
    error,
    fetchDashboard,
  }
}