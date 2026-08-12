import type { Role } from '~/types'
import { getHomeRouteForRole } from '~/composables/useAuth'

export async function ensureAuthenticated(): Promise<boolean> {
  const { accessToken, user, initAuth } = useAuth()

  if (!accessToken.value) {
    await navigateTo('/login')
    return false
  }

  if (!user.value) {
    await initAuth()
  }

  if (!user.value) {
    await navigateTo('/login')
    return false
  }

  return true
}

export async function ensureRole(allowedRoles: Role[]): Promise<boolean> {
  const authenticated = await ensureAuthenticated()
  if (!authenticated) return false

  const { user } = useAuth()

  if (!user.value || !allowedRoles.includes(user.value.role)) {
    await navigateTo(getHomeRouteForRole(user.value?.role))
    return false
  }

  return true
}