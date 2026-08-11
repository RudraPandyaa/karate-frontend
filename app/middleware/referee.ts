export default defineNuxtRouteMiddleware(async () => {
  const {
    accessToken,
    user,
    initAuth,
  } = useAuth()

  if (!accessToken.value) {
    return navigateTo('/login')
  }

  if (!user.value) {
    await initAuth()
  }

  if (!user.value) {
    return navigateTo('/login')
  }

  const allowedRoles = [
    'ADMIN',
    'SUPER_ADMIN',
    'ORGANIZER',
    'REFEREE',
  ]

  if (!allowedRoles.includes(user.value.role)) {
    return navigateTo('/dashboard')
  }
})