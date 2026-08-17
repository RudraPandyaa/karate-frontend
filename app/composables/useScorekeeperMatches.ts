import type { MatchListItem } from '~/composables/useMatches'

export function useScorekeeperMatches() {
  const { api } = useApi()

  const matches = useState<MatchListItem[]>('scorekeeper-matches', () => [])
  const pending = useState('scorekeeper-matches-pending', () => false)
  const error = useState<string | null>('scorekeeper-matches-error', () => null)

  async function fetchAssignedToScorekeeper() {
    pending.value = true
    error.value = null
    try {
      matches.value = await api<MatchListItem[]>(
        '/matches/assigned/scorekeeper',
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
    fetchAssignedToScorekeeper,
  }
}