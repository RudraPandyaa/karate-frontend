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
    error.value = null

    try {
      const created = await api<Category>('/categories', {
        method: 'POST',
        body: payload,
      })

      // Soft merge — no pending / no full-page loader
      const tournament = tournaments.value.find(
        (t) => t.id === payload.tournamentId,
      )
      rows.value = [
        {
          ...created,
          tournament: created.tournament ?? (tournament
            ? { id: tournament.id, name: tournament.name }
            : undefined),
        },
        ...rows.value,
      ]
      return created
    } catch (err: any) {
      error.value =
        err?.data?.message || err?.message || 'Unable to create category'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateCategory(id: string, payload: CategoryPayload) {
    saving.value = true
    error.value = null

    try {
      const updated = await api<Category>(`/categories/${id}`, {
        method: 'PATCH',
        body: payload,
      })

      const tournament = tournaments.value.find(
        (t) => t.id === payload.tournamentId,
      )

      rows.value = rows.value.map((c) =>
        c.id === id
          ? {
              ...c,
              ...updated,
              tournament:
                updated.tournament ??
                (tournament
                  ? { id: tournament.id, name: tournament.name }
                  : c.tournament),
            }
          : c,
      )
      return updated
    } catch (err: any) {
      error.value =
        err?.data?.message || err?.message || 'Unable to update category'
      throw err
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