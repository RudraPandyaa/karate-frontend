import { ref } from 'vue'

export interface Athlete {
  id: string
  name: string
  state: string
  country: string
  createdAt?: string
  updatedAt?: string
  _count?: {
    categories: number
  }
}

export interface CreateAthleteDto {
  name: string
  state: string
  country?: string
}

export interface Enrollment {
  id: string
  categoryId: string
  athleteId: string
  seed: number | null
  category: {
    id: string
    name: string
    ageGroup: string
    gender: string
    discipline: string
    tournament: {
      id: string
      name: string
    }
  }
}

export interface EnrollPayload {
  categoryId: string
  seed?: number
}

export function useAthletes() {
  const { api } = useApi()

  const athletes = ref<Athlete[]>([])
  const enrollments = ref<Enrollment[]>([])
  const pending = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchAthletes(search = '') {
    pending.value = true
    error.value = null

    try {
      athletes.value = await api<Athlete[]>('/athletes', {
        query: search ? { search } : undefined,
      })
    } catch (err: any) {
      console.error(err)
      error.value = err?.data?.message || err.message || 'Failed to load athletes'
    } finally {
      pending.value = false
    }
  }

  async function createAthlete(payload: CreateAthleteDto) {
    await api('/athletes', { method: 'POST', body: payload })
    await fetchAthletes()
  }

  async function updateAthlete(id: string, payload: Partial<CreateAthleteDto>) {
    await api(`/athletes/${id}`, { method: 'PATCH', body: payload })
    await fetchAthletes()
  }

  async function deleteAthlete(id: string) {
    await api(`/athletes/${id}`, { method: 'DELETE' })
    await fetchAthletes()
  }

  async function getAthlete(id: string) {
    return await api<Athlete>(`/athletes/${id}`)
  }

  // ----- Enrollment -----

  async function fetchEnrollments(athleteId: string) {
    pending.value = true
    error.value = null

    try {
      enrollments.value = await api<Enrollment[]>(`/athletes/${athleteId}/enrollments`)
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'Failed to load enrollments'
    } finally {
      pending.value = false
    }
  }

  async function enrollAthlete(athleteId: string, payload: EnrollPayload) {
    saving.value = true

    try {
      await api(`/athletes/${athleteId}/enroll`, {
        method: 'POST',
        body: payload,
      })
      await fetchEnrollments(athleteId)
    } finally {
      saving.value = false
    }
  }

  async function unenrollAthlete(athleteId: string, categoryId: string) {
    saving.value = true

    try {
      await api(`/athletes/${athleteId}/enroll/${categoryId}`, {
        method: 'DELETE',
      })
      enrollments.value = enrollments.value.filter((e) => e.categoryId !== categoryId)
    } finally {
      saving.value = false
    }
  }

  return {
    athletes,
    enrollments,
    pending,
    saving,
    error,
    fetchAthletes,
    createAthlete,
    updateAthlete,
    deleteAthlete,
    getAthlete,
    fetchEnrollments,
    enrollAthlete,
    unenrollAthlete,
  }
}