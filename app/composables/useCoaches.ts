import { ref } from 'vue'

export interface Coach {
  id: string
  firstName: string
  lastName: string
  phone?: string | null
  email?: string | null
  dojoId?: string | null
  userId?: string | null
  dojo?: { id: string; name: string } | null
  user?: { id: string; name?: string } | null
  athletes?: any[]
  createdAt?: string
  updatedAt?: string
  _count?: {
    athletes: number
  }
}

export interface CreateCoachDto {
  firstName: string
  lastName: string
  phone?: string
  email?: string
  dojoId?: string
  userId?: string
}

export function useCoaches() {
  const { api } = useApi()

  const coaches = ref<Coach[]>([])
  const pending = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchCoaches(search = '') {
    pending.value = true
    error.value = null

    try {
      coaches.value = await api<Coach[]>('/coaches', {
        query: search ? { search } : undefined,
      })
    } catch (err: any) {
      console.error(err)
      error.value = err?.data?.message || err.message || 'Failed to load coaches'
    } finally {
      pending.value = false
    }
  }

  async function createCoach(payload: CreateCoachDto) {
    saving.value = true
    try {
      const coach = await api<Coach>('/coaches', {
        method: 'POST',
        body: payload,
      })
      await fetchCoaches()
      return coach
    } finally {
      saving.value = false
    }
  }

  async function updateCoach(id: string, payload: Partial<CreateCoachDto>) {
    saving.value = true
    try {
      const coach = await api<Coach>(`/coaches/${id}`, {
        method: 'PATCH',
        body: payload,
      })
      await fetchCoaches()
      return coach
    } finally {
      saving.value = false
    }
  }

  async function deleteCoach(id: string) {
    await api(`/coaches/${id}`, { method: 'DELETE' })
    await fetchCoaches()
  }

  async function getCoach(id: string) {
    return await api<Coach>(`/coaches/${id}`)
  }

  async function getCoachAthletes(id: string) {
    return await api<any[]>(`/coaches/${id}/athletes`)
  }

  return {
    coaches,
    pending,
    saving,
    error,
    fetchCoaches,
    createCoach,
    updateCoach,
    deleteCoach,
    getCoach,
    getCoachAthletes,
  }
}