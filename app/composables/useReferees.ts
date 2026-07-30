import { ref } from 'vue'

export interface Referee {
  id: string
  firstName: string
  lastName: string
  photoUrl?: string | null
  country?: string | null
  license?: string | null
  rank?: string | null
  certification?: string | null
  status?: string
  phone?: string | null
  email?: string | null
  userId?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface CreateRefereeDto {
  firstName: string
  lastName: string
  country?: string
  license?: string
  rank?: string
  certification?: string
  status?: string
  phone?: string
  email?: string
  userId?: string
}

export function useReferees() {
  const { api } = useApi()

  const referees = ref<Referee[]>([])
  const pending = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchReferees(search = '', status = '') {
    pending.value = true
    error.value = null

    try {
      referees.value = await api<Referee[]>('/referees', {
        query: {
          ...(search ? { search } : {}),
          ...(status ? { status } : {}),
        },
      })
    } catch (err: any) {
      console.error(err)
      error.value = err?.data?.message || err.message || 'Failed to load referees'
    } finally {
      pending.value = false
    }
  }

  async function createReferee(payload: CreateRefereeDto) {
    saving.value = true
    try {
      const referee = await api<Referee>('/referees', {
        method: 'POST',
        body: payload,
      })
      await fetchReferees()
      return referee
    } finally {
      saving.value = false
    }
  }

  async function updateReferee(id: string, payload: Partial<CreateRefereeDto>) {
    saving.value = true
    try {
      const referee = await api<Referee>(`/referees/${id}`, {
        method: 'PATCH',
        body: payload,
      })
      await fetchReferees()
      return referee
    } finally {
      saving.value = false
    }
  }

  async function deleteReferee(id: string) {
    await api(`/referees/${id}`, { method: 'DELETE' })
    await fetchReferees()
  }

  async function getReferee(id: string) {
    return await api<Referee>(`/referees/${id}`)
  }

  async function uploadPhoto(refereeId: string, file: File) {
    saving.value = true
    const formData = new FormData()
    formData.append('photo', file)

    try {
      const response = await api(`/referees/upload-photo/${refereeId}`, {
        method: 'POST',
        body: formData,
      })
      await fetchReferees()
      return response
    } catch (err: any) {
      console.error(err)
      throw err
    } finally { 
      saving.value = false
    }
  }

  return {
    referees,
    pending,
    saving,
    error,
    fetchReferees,
    createReferee,
    updateReferee,
    deleteReferee,
    getReferee,
    uploadPhoto,
  }
}