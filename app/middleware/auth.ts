export default defineNuxtRouteMiddleware(async (to) => {
  const publicRoutes = [
    '/login',
    '/register',
    '/live-scoring',
    '/live',
    '/matches',
  ]

  if (publicRoutes.some((path) => to.path.startsWith(path))) {
    return
  }

  const { accessToken, user, initAuth } = useAuth()

  // No token means definitely not logged in
  if (!accessToken.value) {
    return navigateTo('/login')
  }

  // Token exists but user is not loaded yet
  if (!user.value) {
    await initAuth()
  }

  // Token may have been invalid
  if (!user.value) {
    return navigateTo('/login')
  }
})