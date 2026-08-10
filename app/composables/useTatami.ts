import { useApi } from '~/composables/useApi'


export function getTatamiLabel(
  tatami?: { number: number; name?: string | null } | null
): string {
  if (!tatami) return '—'

  if (tatami.name?.trim()) {
    return `Tatami ${tatami.number} – ${tatami.name.trim()}`
  }

  return `Tatami ${tatami.number}`
}

export interface TatamiMatch {
  id: string
  round?: string
  status: string

  // Added for tatami scheduling — see composables/useTatamiSchedule.ts.
  // scheduledTime: ISO string set explicitly by staff when creating/editing
  // a match. timerSeconds: match duration, used to project when the next
  // match on this tatami is expected to start.
  scheduledTime?: string | null
  timerSeconds?: number | null

  redAthlete?: {
    id: string
    name: string
  }

  blueAthlete?: {
    id: string
    name: string
  }

  category?: {
    id: string
    name: string
  }
}

export interface Tatami {
  id: string
  tournamentId: string
  number: number
  name?: string

  tournament?: {
    id: string
    name: string
  }

  categories?: {
    id: string
    name: string
  }[]

  matches?: TatamiMatch[]

  createdAt?: string
  updatedAt?: string
}

export interface TatamiPayload {
  tournamentId: string
  number: number
  name?: string
}

export function useTatami() {
  const { api } = useApi()

  const rows = ref<Tatami[]>([])
  const current = ref<Tatami | null>(null)

  const pending = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchTatami(tournamentId: string) {
    pending.value = true
    error.value = null

    try {
      rows.value = await api<Tatami[]>(
        `/tatami/tournament/${tournamentId}`
      )
    } catch (err: any) {
      console.error(err)
      error.value =
        err?.data?.message ||
        err?.message ||
        'Failed to load tatamis'
    } finally {
      pending.value = false
    }
  }

  async function fetchAll() {
    pending.value = true
    error.value = null

    try {
      rows.value = await api<Tatami[]>('/tatami')
    } catch (err: any) {
      console.error(err)
      error.value =
        err?.data?.message ||
        err?.message ||
        'Failed to load tatamis'
    } finally {
      pending.value = false
    }
  }

  async function fetchOne(id: string) {
    pending.value = true
    error.value = null

    try {
      current.value = await api<Tatami>(`/tatami/${id}`)
    } catch (err: any) {
      console.error(err)
      error.value =
        err?.data?.message ||
        err?.message ||
        'Failed to load tatami'
    } finally {
      pending.value = false
    }
  }

  async function createTatami(payload: TatamiPayload) {
  saving.value = true
  error.value = null

  try {
    const created = await api<Tatami>('/tatami', {
      method: 'POST',
      body: payload,
    })

    rows.value.push(created)

    return created
    } catch (err: any) {
      console.error(err)

      error.value =
        err?.data?.message ||
        err?.message ||
        'Failed to create tatami'

      throw err
    } finally {
      saving.value = false
    }
  }

  async function updateTatami(
    id: string,
    payload: Partial<TatamiPayload>
  ) {
    saving.value = true
    error.value = null

    try {
      const updated = await api<Tatami>(`/tatami/${id}`, {
        method: 'PATCH',
        body: payload,
      })

      const index = rows.value.findIndex(t => t.id === id)

      if (index !== -1) {
        rows.value[index] = updated
      }

      current.value = updated

      return updated
    } catch (err: any) {
      console.error(err)
      error.value =
        err?.data?.message ||
        err?.message ||
        'Failed to update tatami'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function deleteTatami(id: string) {
    saving.value = true
    error.value = null

    try {
      await api(`/tatami/${id}`, {
        method: 'DELETE',
      })

      rows.value = rows.value.filter(t => t.id !== id)
    } catch (err: any) {
      console.error(err)
      error.value =
        err?.data?.message ||
        err?.message ||
        'Failed to delete tatami'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function autoAssign(tournamentId: string) {
    saving.value = true

    try {
      const result = await api<{ assigned: number }>(
        `/tatami/${tournamentId}/auto-assign`,
        {
          method: 'POST',
        }
      )

      await fetchTatami(tournamentId)

      return result
    } catch (err: any) {
      console.error(err)
      error.value =
        err?.data?.message ||
        err?.message ||
        'Failed to auto assign'
      throw err
    } finally {
      saving.value = false
    }
  }

  async function getQueue(tatamiId: string) {
    try {
      return await api<{
        current: TatamiMatch | null
        next: TatamiMatch[]
      }>(`/tatami/${tatamiId}/queue`)
    } catch (err: any) {
      console.error(err)

      return {
        current: null,
        next: [],
      }
    }
  }

  async function assignMatch(
    tatamiId: string,
    matchId: string
  ) {
    return api(`/tatami/${tatamiId}/assign-match`, {
      method: 'PATCH',
      body: {
        matchId,
      },
    })
  }

  return {
    rows,
    current,

    pending,
    saving,
    error,

    fetchTatami,
    fetchAll,
    fetchOne,

    createTatami,
    updateTatami,
    deleteTatami,

    autoAssign,
    getQueue,
    assignMatch,
  }
}