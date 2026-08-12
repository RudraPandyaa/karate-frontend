import { STAFF_ROLES, getHomeRouteForRole } from '~/composables/useAuth'

export default defineNuxtRouteMiddleware(async () => {
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

  if (!STAFF_ROLES.includes(user.value.role)) {
    return navigateTo(getHomeRouteForRole(user.value.role))
  }
})