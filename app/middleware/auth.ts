export default defineNuxtRouteMiddleware((to) => {
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

  const { isLoggedIn } = useAuth()

  if (!isLoggedIn.value) {
    return navigateTo('/login')
  }
})