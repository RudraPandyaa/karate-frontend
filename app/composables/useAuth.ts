import type { User } from '~/types'

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)
  const accessToken = useCookie<string | null>('accessToken', { default: () => null })
  const STAFF_ROLES = ['SCOREKEEPER', 'REFEREE', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']
  const isStaff = computed(() => !!user.value && STAFF_ROLES.includes(user.value.role))
  const isLoggedIn = computed(() => !!user.value)

  async function login(email: string, password: string) {
    try {
      const res = await $fetch<{ accessToken: string; user: User }>('/auth/login', {
        method: 'POST',
        body: { email, password },
        baseURL: useRuntimeConfig().public.apiBase,
      })

      accessToken.value = res.accessToken
      user.value = res.user

      return true
    } catch (e) {
      console.error(e)
      return false
    }
  }

  async function logout() {
    accessToken.value = null
    user.value = null
    await navigateTo('/login')
  }

  // Auto load user from token if exists (on app start)
  const initAuth = async () => {
    if (accessToken.value) {
      try {
        const res = await $fetch<User>('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken.value}` },
          baseURL: useRuntimeConfig().public.apiBase,
        })
        user.value = res
      } catch (e) {
        accessToken.value = null
      }
    }
  }

  return { user, isLoggedIn, isStaff, login, logout, initAuth }
}