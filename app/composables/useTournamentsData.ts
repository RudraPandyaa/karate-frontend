import type {
  RawTournamentListItem,
  TournamentRow,
  TournamentDisplayStatus,
} from '~/types'

function deriveDisplayStatus(t: RawTournamentListItem): TournamentDisplayStatus {
  // Keep cancelled as-is
  if (t.status === 'CANCELLED') return 'CANCELLED'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(t.startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(t.endDate)
  end.setHours(23, 59, 59, 999)

  if (today < start) return 'UPCOMING'
  if (today > end) return 'COMPLETED'
  return 'ONGOING' // start ≤ today ≤ end
}

export function useTournamentsData() {
  const { api } = useApi()

  const rows = ref<TournamentRow[]>([])
  const stats = ref({
    totalEvents: 0,
    activeNow: 0,
    registeredAthletes: 0,
  })
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    pending.value = true
    error.value = null
    try {
      const data = await api<RawTournamentListItem[]>('/tournaments')
      rows.value = data.map((t): TournamentRow => ({
        id: t.id,
        name: t.name,
        location: t.location,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        displayStatus: deriveDisplayStatus(t),
        categoriesCount: t._count?.categories ?? 0,
        athletesCount: t.athletesCount ?? 0,
      }))

      stats.value = {
        totalEvents: rows.value.length,
        activeNow: rows.value.filter((r) => r.displayStatus === 'ONGOING').length,
        registeredAthletes: rows.value.reduce((sum, r) => sum + r.athletesCount, 0),
      }
    } catch (e: any) {
      error.value = `API Error: ${e.message}. Check backend is running on correct port.`
      console.error('Tournaments API failed:', e)
    } finally {
      pending.value = false
    }
  }

  async function createTournament(payload: any) {
    return api('/tournaments', { method: 'POST', body: payload })
  }

  return { rows, stats, pending, error, fetchAll, createTournament }
}