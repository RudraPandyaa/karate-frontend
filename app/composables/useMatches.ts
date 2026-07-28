import { ref } from 'vue'
import { useApi } from '~/composables/useApi'

export type MatchRound =
  | 'ROUND_1'
  | 'ROUND_2'
  | 'ROUND_3'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'QUARTERFINAL'
  | 'SEMI_FINAL'
  | 'SEMIFINAL'
  | 'FINAL'
  | 'FINAL_MATCH'
  | 'REPECHAGE'
  | 'BRONZE'
  | 'BRONZE_MEDAL'

export type MatchStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'

export interface MatchListItem {
  id: string
  round: MatchRound
  status: MatchStatus
  redScore: number
  blueScore: number

  redAthlete: {
    id: string
    name: string
  } | null

  blueAthlete: {
    id: string
    name: string
  } | null

  category: {
    id: string
    name: string
  } | null

  tatami: {
    id: string
    number: number
  } | null
}

export interface CreateMatchPayload {
  categoryId: string
  tatamiId?: string

  round: MatchRound

  bracketSlot?: number

  redAthleteId?: string
  blueAthleteId?: string

  refereeId?: string
  scorekeeperId?: string

  status?: MatchStatus

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
      error.value =
        err?.data?.message ||
        err?.message ||
        'Unable to load matches'
    } finally {
      pending.value = false
    }
  }

  async function fetchOne(id: string) {
    return api<MatchListItem>(`/matches/${id}`)
  }

  async function createMatch(payload: CreateMatchPayload) {
    return api('/matches', {
      method: 'POST',
      body: payload,
    })
  }

  async function updateMatch(
    id: string,
    payload: Partial<CreateMatchPayload>,
  ) {
    return api(`/matches/${id}`, {
      method: 'PATCH',
      body: payload,
    })
  }

  async function deleteMatch(id: string) {
    return api(`/matches/${id}`, {
      method: 'DELETE',
    })
  }

  return {
    matches,
    pending,
    error,
    fetchAll,
    fetchOne,
    createMatch,
    updateMatch,
    deleteMatch,
  }
}