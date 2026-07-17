export interface MatchListItem {
  id: string
  round: string
  status: string
  redScore: number
  blueScore: number
  redAthlete: { id: string; name: string } | null
  blueAthlete: { id: string; name: string } | null
  category: { id: string; name: string } | null
  tatami: { id: string; number: number } | null
}

export interface CreateMatchPayload {
  categoryId: string
  tatamiId?: string
  round: string
  bracketSlot?: number
  redAthleteId?: string
  blueAthleteId?: string
  refereeId?: string
  scorekeeperId?: string
  status?: string
  timerSeconds?: number
}

export function useMatches() {
  const { api } = useApi()

  const matches = ref<MatchListItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    pending.value = true
    error.value = null
    try {
      matches.value = await api<MatchListItem[]>('/matches')
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'Unable to load matches'
    } finally {
      pending.value = false
    }
  }

  async function fetchOne(id: string) {
    return api(`/matches/${id}`)
  }

  async function createMatch(payload: CreateMatchPayload) {
    return api('/matches', { method: 'POST', body: payload })
  }

  async function updateMatch(id: string, payload: Partial<CreateMatchPayload>) {
    return api(`/matches/${id}`, { method: 'PATCH', body: payload })
  }

  async function deleteMatch(id: string) {
    return api(`/matches/${id}`, { method: 'DELETE' })
  }

  return { matches, pending, error, fetchAll, fetchOne, createMatch, updateMatch, deleteMatch }
}