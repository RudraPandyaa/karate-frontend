export function useEventBadges(tournamentId: string) {
  const { api } = useApi()

  const badges = ref<any[]>([])
  const loading = ref(false)
  const generating = ref(false)

  // Split per-format so one export button lighting up doesn't affect the other
  const exportingPdf = ref(false)
  const exportingExcel = ref(false)

  async function fetchBadges(role?: string) {
    loading.value = true

    try {
      badges.value = await api(
        `/tournaments/${tournamentId}/badges`,
        {
          query: role ? { role } : undefined,
        },
      )
    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function generateBadges(
    role: string,
    referenceIds: string[],
  ) {
    generating.value = true

    try {
      const result = await api(
        `/tournaments/${tournamentId}/badges/generate`,
        {
          method: 'POST',
          body: {
            role,
            referenceIds,
          },
        },
      )

      await fetchBadges(role)

      return result
    } finally {
      generating.value = false
    }
  }

  async function markPrinted(
    badgeIds: string[],
    role?: string,
  ) {
    await api(
      `/tournaments/${tournamentId}/badges/mark-printed`,
      {
        method: 'PATCH',
        body: { badgeIds },
      },
    )

    await fetchBadges(role)
  }

  async function exportPdf(role?: string) {
    exportingPdf.value = true

    try {
      const config = useRuntimeConfig()

      const query = role
        ? `?role=${encodeURIComponent(role)}`
        : ''

      window.open(
        `${config.public.apiBase}/tournaments/${tournamentId}/badges/export/pdf${query}`,
        '_blank',
      )
    } finally {
      exportingPdf.value = false
    }
  }

  async function exportExcel(role?: string) {
    exportingExcel.value = true

    try {
      const config = useRuntimeConfig()

      const query = role
        ? `?role=${encodeURIComponent(role)}`
        : ''

      window.open(
        `${config.public.apiBase}/tournaments/${tournamentId}/badges/export/excel${query}`,
        '_blank',
      )
    } finally {
      exportingExcel.value = false
    }
  }

  return {
    badges,

    loading,
    generating,
    exportingPdf,
    exportingExcel,

    fetchBadges,
    generateBadges,
    markPrinted,

    exportPdf,
    exportExcel,
  }
}