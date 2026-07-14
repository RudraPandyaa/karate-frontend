export default defineNuxtRouteMiddleware(() => {
  const { isStaff } = useAuth()
  if (!isStaff.value) {
    return navigateTo('/matches')
  }
})