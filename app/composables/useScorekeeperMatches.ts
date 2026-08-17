import type { MatchListItem } from '~/composables/useMatches'

export type MatchScope = 'all' | 'mine'

export function useScorekeeperMatches() {
  const { api } = useApi()

  const matches = useState<MatchListItem[]>('scorekeeper-matches', () => [])
  const pending = useState('scorekeeper-matches-pending', () => false)
  const error = useState<string | null>(
    'scorekeeper-matches-error',
    () => null,
  )

  async function fetchMatches(scope: MatchScope = 'mine') {
    pending.value = true
    error.value = null

    try {
      const endpoint =
        scope === 'mine'
          ? '/matches/assigned/scorekeeper'
          : '/matches'

      matches.value = await api<MatchListItem[]>(endpoint)
    } catch (err: any) {
      error.value =
        err?.data?.message ||
        err?.message ||
        'Unable to load matches'
    } finally {
      pending.value = false
    }
  }

  return {
    matches,
    pending,
    error,
    fetchMatches,
  }
}