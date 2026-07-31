import { ref } from 'vue'

export interface Athlete {
  id: string
  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  fullName?: string | null
  name?: string
  gender?: string | null
  dateOfBirth?: string | null
  bloodGroup?: string | null
  disability?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  state: string
  postalCode?: string | null
  country: string
  guardianName?: string | null
  emergencyContact?: string | null
  emergencyPhone?: string | null
  style?: string | null
  currentRank?: string | null
  federationId?: string | null
  photoUrl?: string | null
  dojoId?: string | null
  coachId?: string | null
  dojo?: { id: string; name: string } | null
  coach?: { id: string; firstName: string; lastName: string } | null
  createdAt?: string
  updatedAt?: string
  _count?: {
    categories: number
  }
  // Enrolled categories, if the /athletes endpoint returns them inline.
  // Used by AthleteTable to show category names instead of just a count,
  // and to support filtering the athlete list by category.
  categories?: { id: string; name: string }[]
}

export interface AthleteHistory {
  id: string
  athleteId: string
  tournamentId?: string | null
  categoryId?: string | null
  medal?: 'GOLD' | 'SILVER' | 'BRONZE' | null
  year: number
  position?: number | null
  tournament?: { id: string; name: string } | null
  category?: { id: string; name: string } | null
  createdAt?: string
}

export interface CreateHistoryDto {
  tournamentId?: string
  categoryId?: string
  medal?: 'GOLD' | 'SILVER' | 'BRONZE'
  year: number
  position?: number
}

export interface CreateAthleteDto {
  firstName: string
  middleName?: string
  lastName: string
  gender: string
  dateOfBirth: string
  bloodGroup?: string
  disability?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state: string
  postalCode?: string
  country?: string
  guardianName?: string
  emergencyContact?: string
  emergencyPhone?: string
  style?: string
  currentRank?: string
  federationId?: string
  dojoId?: string
  coachId?: string
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
  const histories = ref<AthleteHistory[]>([])
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
    const athlete = await api<Athlete>('/athletes', {
      method: 'POST',
      body: payload,
    })
    await fetchAthletes()
    return athlete
  }

  async function updateAthlete(id: string, payload: Partial<CreateAthleteDto>) {
    const athlete = await api<Athlete>(`/athletes/${id}`, {
      method: 'PATCH',
      body: payload,
    })
    await fetchAthletes()
    return athlete
  }

  async function deleteAthlete(id: string) {
    await api(`/athletes/${id}`, { method: 'DELETE' })
    await fetchAthletes()
  }

  async function getAthlete(id: string) {
    return await api<Athlete>(`/athletes/${id}`)
  }

  // ----- Enrollments -----

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

  async function uploadPhoto(athleteId: string, file: File) {
    saving.value = true
    const formData = new FormData()
    formData.append('photo', file)

    try {
      const response = await api(`/athletes/upload-photo/${athleteId}`, {
        method: 'POST',
        body: formData,
      })
      await fetchAthletes()
      return response
    } catch (err: any) {
      console.error(err)
      throw err
    } finally {
      saving.value = false
    }
  }

  // ----- Championship History -----

  async function fetchHistory(athleteId: string) {
    try {
      histories.value = await api<AthleteHistory[]>(`/athletes/${athleteId}/history`)
    } catch (err: any) {
      console.error(err)
      error.value = err?.data?.message || 'Failed to load history'
    }
  }

  async function addHistory(athleteId: string, payload: CreateHistoryDto) {
    saving.value = true
    try {
      await api(`/athletes/${athleteId}/history`, {
        method: 'POST',
        body: payload,
      })
      await fetchHistory(athleteId)
    } finally {
      saving.value = false
    }
  }

  async function updateHistory(historyId: string, payload: Partial<CreateHistoryDto>) {
    saving.value = true
    try {
      await api(`/athletes/history/${historyId}`, {
        method: 'PATCH',
        body: payload,
      })
    } finally {
      saving.value = false
    }
  }

  async function removeHistory(historyId: string) {
    saving.value = true
    try {
      await api(`/athletes/history/${historyId}`, {
        method: 'DELETE',
      })
      histories.value = histories.value.filter((h) => h.id !== historyId)
    } finally {
      saving.value = false
    }
  }

  return {
    athletes,
    enrollments,
    histories,
    pending,
    saving,
    error,
    fetchAthletes,
    createAthlete,
    updateAthlete,
    deleteAthlete,
    uploadPhoto,
    getAthlete,
    fetchEnrollments,
    enrollAthlete,
    unenrollAthlete,
    fetchHistory,
    addHistory,
    updateHistory,
    removeHistory,
  }
}