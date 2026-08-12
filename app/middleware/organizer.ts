import { ORGANIZER_ROLES, getHomeRouteForRole } from '~/composables/useAuth'

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

  if (!ORGANIZER_ROLES.includes(user.value.role)) {
    const target = getHomeRouteForRole(user.value.role)

    // Prevent infinite redirect to the same route
    if (target === to.path) {
      return navigateTo('/live')
    }

    return navigateTo(target)
  }
})