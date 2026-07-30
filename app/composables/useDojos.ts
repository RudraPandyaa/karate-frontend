import { ref } from 'vue'

export interface Dojo {
  id: string
  name: string
  address?: string | null
  city?: string | null
  state?: string | null
  country?: string | null
  _count?: {
    athletes: number
    coaches: number
  }
}

interface PaginatedDojos {
  total: number
  page: number
  limit: number
  totalPages: number
  data: Dojo[]
}

export function useDojos() {
  const { api } = useApi()

  const rows = ref<Dojo[]>([])
  const total = ref(0)
  const pending = ref(false)
  const error = ref<string | null>(null)

  /**
   * For dropdown lists, pass a high limit (default 100) so the full
   * set of dojos comes back in one page. Pass search to filter server-side.
   */
  async function fetchDojos(search = '', page = 1, limit = 100) {
    pending.value = true
    error.value = null

    try {
      const res = await api<PaginatedDojos>('/dojos', {
        query: { page, limit, ...(search ? { search } : {}) },
      })
      rows.value = res.data
      total.value = res.total
    } catch (err: any) {
      console.error(err)
      error.value = err?.data?.message || err.message || 'Failed to load dojos'
    } finally {
      pending.value = false
    }
  }

  async function getDojo(id: string) {
    return await api<Dojo & { athletes: any[]; coaches: any[] }>(`/dojos/${id}`)
  }

  return {
    rows,
    total,
    pending,
    error,
    fetchDojos,
    getDojo,
  }
}