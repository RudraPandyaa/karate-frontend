import { ref } from 'vue'
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

  const dashboard = ref<AthleteDashboard | null>(null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetchDashboard(tournamentId?: string) {
    pending.value = true
    error.value = null

    try {
      dashboard.value = await api<AthleteDashboard>(
          '/athletes/me/dashboard',
        {
          query: tournamentId
            ? { tournamentId }
            : undefined,
        },
      )
    } catch (err: any) {
      error.value =
        err?.data?.message ||
        err?.message ||
        'Unable to load athlete dashboard'
    } finally {
      pending.value = false
    }
  }

  return {
    dashboard,
    pending,
    error,
    fetchDashboard,
  }
}