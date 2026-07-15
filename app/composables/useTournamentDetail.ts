import type { Tournament, Match, Athlete, Category } from '~/types'

export const useTournamentDetail = (tournamentId: string) => {
  const tournament = ref<Tournament | null>(null)
  const matches = ref<Match[]>([])
  const athletes = ref<Athlete[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const fetchTournament = async () => {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()

      // Fetch main tournament data
      const [tData, mData, aData, cData] = await Promise.all([
        $fetch<Tournament>(`/tournaments/${tournamentId}`, {
          baseURL: config.public.apiBase,
        }),
        $fetch<Match[]>(`/tournaments/${tournamentId}/matches`, {
          baseURL: config.public.apiBase,
        }),
        $fetch<Athlete[]>(`/tournaments/${tournamentId}/athletes`, {
          baseURL: config.public.apiBase,
        }),
        $fetch<Category[]>(`/tournaments/${tournamentId}/categories`, {
          baseURL: config.public.apiBase,
        })
      ])

      tournament.value = tData
      matches.value = mData
      athletes.value = aData
      categories.value = cData
    } catch (err: any) {
      console.error(err)
      error.value = err?.data?.message || 'Failed to load tournament details'
    } finally {
      loading.value = false
    }
  }

  // Refresh function
  const refresh = async () => {
    await fetchTournament()
  }

  // Auto fetch on mount
  onMounted(() => {
    if (tournamentId) {
      fetchTournament()
    }
  })

  // Watch for ID changes (if used in dynamic route)
  watch(() => tournamentId, (newId) => {
    if (newId) fetchTournament()
  })

  return {
    tournament: readonly(tournament),
    matches: readonly(matches),
    athletes: readonly(athletes),
    categories: readonly(categories),
    loading: readonly(loading),
    error: readonly(error),
    refresh
  }
}