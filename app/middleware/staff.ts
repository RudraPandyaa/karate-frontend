export default defineNuxtRouteMiddleware(async () => {
  const {
    accessToken,
    user,
    isStaff,
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

  if (!isStaff.value) {
    return navigateTo('/matches')
  }
})