import type { Role } from '~/types'
import { getHomeRouteForRole } from '~/composables/useAuth'

const ALLOWED: Role[] = ['SUPER_ADMIN', 'ADMIN', 'ORGANIZER', 'SCOREKEEPER']

export default defineNuxtRouteMiddleware(async (to) => {
  const { accessToken, user, initAuth } = useAuth()

  if (!accessToken.value) {
    return navigateTo('/login')
  }

  if (!user.value) {
    await initAuth()
  }

  if (!user.value) {
    return navigateTo('/login')
  }

  if (!ALLOWED.includes(user.value.role)) {
    const target = getHomeRouteForRole(user.value.role)
    if (target === to.path) {
      return navigateTo('/live')
    }
    return navigateTo(target)
  }
})