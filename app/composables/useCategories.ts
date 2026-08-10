import { useApi } from '~/composables/useApi'

export interface Category {
  id: string
  tournamentId: string

  name: string
  ageGroup: string

  minAge: number
  maxAge: number

  gender: 'MALE' | 'FEMALE' | 'MIXED'
  discipline: 'KATA' | 'KUMITE' | 'TEAM_KATA' | 'TEAM_KUMITE'

  weightMin: number | null
  weightMax: number | null

  tatamiId?: string | null
  tatami?: {
    id: string
    number: number
    name?: string | null
  } | null

  tournament?: {
    id: string
    name: string
  }

  _count?: {
    athletes: number
    matches: number
  }

  createdAt: string
  updatedAt: string
}

export interface TournamentOption {
  id: string
  name: string
}

export interface CategoryPayload {
  tournamentId: string

  name: string
  ageGroup: string

  minAge: number
  maxAge: number

  gender: 'MALE' | 'FEMALE' | 'MIXED'
  discipline: 'KATA' | 'KUMITE' | 'TEAM_KATA' | 'TEAM_KUMITE'

  weightMin?: number | null
  weightMax?: number | null

  tatamiId?: string | null
}

export const useCategories = () => {
  const { api } = useApi()

  const rows = ref<Category[]>([])
  const tournaments = ref<TournamentOption[]>([])

  const pending = ref(false)
  const saving = ref(false)

  const error = ref<string | null>(null)

  async function fetchCategories() {
    pending.value = true
    error.value = null

    try {
      rows.value = await api<Category[]>('/categories')
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'Unable to load categories'
    } finally {
      pending.value = false
    }
  }

  async function fetchTournaments() {
    try {
      tournaments.value = await api<TournamentOption[]>('/tournaments')
    } catch (err) {
      console.error(err)
    }
  }

  async function createCategory(payload: CategoryPayload) {
    saving.value = true
    console.log('PAYLOAD SENT:', JSON.stringify(payload, null, 2))
    
    try {
      await api('/categories', {
        method: 'POST',
        body: payload,
      })

      await fetchCategories()
    } catch (err: any) {
      console.log(err.data) // <-- Add this
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateCategory(id: string, payload: CategoryPayload) {
    saving.value = true

    try {
      await api(`/categories/${id}`, {
        method: 'PATCH',
        body: payload,
      })

      await fetchCategories()
    } finally {
      saving.value = false
    }
  }

  async function deleteCategory(id: string) {
    saving.value = true

    try {
      await api(`/categories/${id}`, {
        method: 'DELETE',
      })

      rows.value = rows.value.filter(c => c.id !== id)
    } finally {
      saving.value = false
    }
  }

  async function refresh() {
    await Promise.all([
      fetchCategories(),
      fetchTournaments(),
    ])
  }

  return {
    rows,
    tournaments,

    pending,
    saving,
    error,

    refresh,

    fetchCategories,
    fetchTournaments,

    createCategory,
    updateCategory,
    deleteCategory,
  }
}