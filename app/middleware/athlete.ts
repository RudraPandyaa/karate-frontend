export default defineNuxtRouteMiddleware(async () => {
  const {
    user,
    isLoggedIn,
    initAuth,
  } = useAuth()

  if (!isLoggedIn.value) {
    await initAuth()
  }

  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }

  if (user.value?.role !== 'ATHLETE') {
    return navigateTo('/dashboard')
  }
})