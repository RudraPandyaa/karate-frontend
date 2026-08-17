export interface Organization {
  id: string
  name: string
  createdAt?: string
  updatedAt?: string
  _count?: {
    tournaments: number
    members: number
  }
}

export function useOrganizations() {
  const { api } = useApi()

  const rows = ref<Organization[]>([])
  const pending = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    pending.value = true
    error.value = null
    try {
      rows.value = await api<Organization[]>('/organizations')
    } catch (err: any) {
      error.value =
        err?.data?.message || err?.message || 'Unable to load organizations'
    } finally {
      pending.value = false
    }
  }

  async function create(name: string) {
    saving.value = true
    try {
      const org = await api<Organization>('/organizations', {
        method: 'POST',
        body: { name },
      })
      await fetchAll()
      return org
    } finally {
      saving.value = false
    }
  }

  async function update(id: string, name: string) {
    saving.value = true
    try {
      const org = await api<Organization>(`/organizations/${id}`, {
        method: 'PATCH',
        body: { name },
      })
      await fetchAll()
      return org
    } finally {
      saving.value = false
    }
  }

  async function remove(id: string) {
    saving.value = true
    try {
      await api(`/organizations/${id}`, { method: 'DELETE' })
      rows.value = rows.value.filter((o) => o.id !== id)
    } finally {
      saving.value = false
    }
  }

  return {
    rows,
    pending,
    saving,
    error,
    fetchAll,
    create,
    update,
    remove,
  }
}