import type { Tournament, Match, Athlete, Category } from '~/types'

export const useTournamentDetail = (tournamentId: string) => {
  const tournament = ref<Tournament | null>(null)
  const matches = ref<Match[]>([])
  const athletes = ref<Athlete[] | any[]>([])
  const categories = ref<Category[]>([])
  const loading = ref(true)
  const error = ref<string | null>(null)

  const { fetchAthletes, athletes: globalAthletes } = useAthletes()

  const fetchTournament = async () => {
    loading.value = true
    error.value = null

    try {
      const config = useRuntimeConfig()

      const [tData, mData, cData] = await Promise.all([
        $fetch<any>(`/tournaments/${tournamentId}`, { baseURL: config.public.apiBase }),
        $fetch<Match[]>(`/tournaments/${tournamentId}/matches`, { baseURL: config.public.apiBase }),
        $fetch<Category[]>(`/tournaments/${tournamentId}/categories`, { baseURL: config.public.apiBase }),
      ])

      await fetchAthletes()

      const athletesCount = globalAthletes.value.length

      tournament.value = {
        ...tData,

        displayStatus: deriveDisplayStatus(tData),

        categoriesCount: cData.length,

        matchesCount: mData.length,

        athletesCount: athletesCount,

        tatamis: tData.tatamis || [],
      }

      matches.value = mData
      categories.value = cData
      athletes.value = globalAthletes.value
      console.log('categories:', JSON.stringify(athletes.value[0]?.categories))

    } catch (err: any) {
      console.error('Tournament fetch error:', err)
      error.value = err?.data?.message || 'Failed to load tournament details'
    } finally {
      loading.value = false
    }
  } 

  const refresh = async () => {
    await fetchTournament()
  }

  onMounted(() => {
    if (tournamentId) fetchTournament()
  })

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
    refresh,
  }
}