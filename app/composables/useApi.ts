export function useApi() {
  const config = useRuntimeConfig()

  const accessToken = useCookie<string | null>('accessToken')

  const api = $fetch.create({
    baseURL: config.public.apiBase,

    onRequest({ options }) {
      const headers = new Headers(options.headers)

      if (accessToken.value) {
        headers.set(
          'Authorization',
          `Bearer ${accessToken.value}`,
        )
      }

      options.headers = headers
    },

    onResponseError({ response }) {
      if (response.status === 401) {
        console.warn(
          '[api] 401 Unauthorized',
        )
      }
    },
  })

  return {
    api,
  }
}