import type { MatchListItem } from '~/types'

export function useRefereeMatches() {
  const { api } = useApi()

  const matches = ref<MatchListItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

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