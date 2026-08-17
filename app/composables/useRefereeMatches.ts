import type { MatchListItem } from '~/composables/useMatches'

export function useRefereeMatches() {
  const { api } = useApi()

  const matches = useState<MatchListItem[]>('referee-matches', () => [])
  const pending = useState('referee-matches-pending', () => false)
  const error = useState<string | null>('referee-matches-error', () => null)

  async function fetchAssignedToReferee() {
    pending.value = true
    error.value = null

    try {
      matches.value = await api<MatchListItem[]>(
        '/matches/assigned/referee',
      )
    } catch (err: any) {
      error.value =
        err?.data?.message ||
        err?.message ||
        'Unable to load assigned matches'
    } finally {
      pending.value = false
    }
  }

  return {
    matches,
    pending,
    error,
    fetchAssignedToReferee,
  }
}