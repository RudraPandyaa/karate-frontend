import type {
  RawTournamentListItem,
  TournamentRow,
  TournamentDisplayStatus,
} from '~/types'

function deriveDisplayStatus(t: RawTournamentListItem): TournamentDisplayStatus {
  if (t.status === 'DRAFT') {
    return new Date(t.startDate) > new Date() ? 'UPCOMING' : 'DRAFT'
  }
  if (t.status === 'ONGOING') return 'LIVE'
  if (t.status === 'COMPLETED') return 'COMPLETED'
  return 'CANCELLED'
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
        subtitle: t.location, // no dedicated subtitle field in schema
        location: t.location,
        startDate: t.startDate,
        endDate: t.endDate,
        status: t.status,
        displayStatus: deriveDisplayStatus(t),
        categoriesCount: t._count?.categories ?? 0,
        athletesCount: 0, // no athlete count on this endpoint yet — see note below
      }))

      stats.value = {
        totalEvents: rows.value.length,
        activeNow: rows.value.filter((r) => r.displayStatus === 'LIVE').length,
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