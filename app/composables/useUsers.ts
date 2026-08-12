import type { Role, User } from '~/types'

export type StaffUser = Pick<User, 'id' | 'name' | 'email' | 'role'> & {
  createdAt?: string
}

export function useUsers() {
  const { api } = useApi()

  const users = ref<StaffUser[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)
  const saving = ref(false)

  async function fetchUsers(params?: { role?: Role; search?: string }) {
    pending.value = true
    error.value = null

    try {
      users.value = await api<StaffUser[]>('/users', {
        query: {
          ...(params?.role ? { role: params.role } : {}),
          ...(params?.search ? { search: params.search } : {}),
        },
      })
    } catch (err: any) {
      error.value =
        err?.data?.message ||
        err?.message ||
        'Unable to load users'
    } finally {
      pending.value = false
    }
  }

  async function updateRole(userId: string, role: Role) {
    saving.value = true
    error.value = null

    try {
      const updated = await api<StaffUser>(`/users/${userId}/role`, {
        method: 'PATCH',
        body: { role },
      })

      // update local list
      const idx = users.value.findIndex((u) => u.id === userId)
      if (idx !== -1) {
        users.value[idx] = { ...users.value[idx], ...updated }
      }

      return updated
    } catch (err: any) {
      error.value =
        err?.data?.message ||
        err?.message ||
        'Failed to update role'
      throw err
    } finally {
      saving.value = false
    }
  }

  return {
    users,
    pending,
    saving,
    error,
    fetchUsers,
    updateRole,
  }
}