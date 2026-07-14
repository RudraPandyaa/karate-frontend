export default defineNuxtRouteMiddleware(() => {
  const { user, isLoggedIn } = useAuth()

  const ALLOWED_ROLES = ['SCOREKEEPER', 'REFEREE', 'ORGANIZER', 'ADMIN', 'SUPER_ADMIN']

  if (!isLoggedIn.value || !ALLOWED_ROLES.includes(user.value!.role)) {
    return navigateTo('/login')
  }
})