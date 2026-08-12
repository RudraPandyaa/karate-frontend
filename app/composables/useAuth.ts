import type {
  LoginResponse,
  Role,
  User,
} from '~/types'

export const STAFF_ROLES: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'ORGANIZER',
  'SCOREKEEPER',
  'REFEREE',
]

export const ADMIN_ROLES: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
]

export const ORGANIZER_ROLES: Role[] = [
  'SUPER_ADMIN',
  'ADMIN',
  'ORGANIZER',
]

export function getHomeRouteForRole(role: Role | undefined | null): string {
  switch (role) {
    case 'ATHLETE':
      return '/athletes/dashboard'
    case 'SCOREKEEPER':
      return '/scorekeeper/dashboard'
    case 'REFEREE':
      return '/referee/dashboard'
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'ORGANIZER':
      return '/dashboard'
    case 'GUEST':
      return '/live'
    default:
      return '/live'
  }
}

export const useAuth = () => {
  const user = useState<User | null>('user', () => null)

  const accessToken = useCookie<string | null>('accessToken', {
    default: () => null,
    sameSite: 'lax',
  })

  const isLoggedIn = computed(() => {
    return !!accessToken.value && !!user.value
  })

  const isStaff = computed(() => {
    return !!user.value && STAFF_ROLES.includes(user.value.role)
  })

  const isAdmin = computed(() => {
    return !!user.value && ADMIN_ROLES.includes(user.value.role)
  })

  async function login(email: string, password: string) {
    try {
      const config = useRuntimeConfig()

      const response = await $fetch<LoginResponse>('/auth/login', {
        method: 'POST',
        baseURL: config.public.apiBase,
        body: {
          email,
          password,
        },
      })

      accessToken.value = response.accessToken
      user.value = response.user

      return true
    } catch (error) {
      console.error('[auth] Login failed:', error)
      accessToken.value = null
      user.value = null
      return false
    }
  }

  async function initAuth() {
    if (!accessToken.value) {
      user.value = null
      return
    }

    try {
      const config = useRuntimeConfig()

      const response = await $fetch<User>('/auth/me', {
        baseURL: config.public.apiBase,
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
        },
      })

      user.value = response
    } catch (error) {
      console.warn('[auth] Token validation failed')
      accessToken.value = null
      user.value = null
    }
  }

  async function logout() {
    accessToken.value = null
    user.value = null
    await navigateTo('/login')
  }

  return {
    user,
    accessToken,
    isLoggedIn,
    isStaff,
    isAdmin,
    login,
    logout,
    initAuth,
  }
}