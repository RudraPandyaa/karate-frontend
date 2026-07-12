/**
 * Thin wrapper around ofetch/$fetch pointed at the NestJS backend.
 *
 * AUTH TODO: we don't yet know your token flow (cookie vs localStorage vs
 * Bearer header). Right now this reads an `accessToken` cookie if present
 * and attaches it as a Bearer token — update `getAuthHeader()` once you
 * share your AuthModule / JwtStrategy so this matches exactly. Given your
 * PetMart history with JwtStrategy.validate() returning `{ userId }` vs
 * `{ id }`, double check whichever guard reads req.user on the backend
 * matches what you decode here too.
 */
export function useApi() {
  const config = useRuntimeConfig()

  function getAuthHeader(): Record<string, string> {
    const token = useCookie<string | null>('accessToken').value
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      options.headers = {
        ...options.headers,
        ...getAuthHeader(),
      } as HeadersInit
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        // TODO: wire up refresh-token flow once RefreshToken endpoint is confirmed
        console.warn('[api] 401 Unauthorized — token missing/expired')
      }
    },
  })

  return { api }
}
