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

  /**
   * Fetch a file through the authenticated `api` client (so the Bearer
   * token from useApi's onRequest hook is actually attached — unlike
   * window.open(), which is a plain browser navigation with no auth
   * headers and was causing the 401) and save it client-side.
   */
  async function downloadFile(path: string, query: string, filename: string) {
    const blob = await api<Blob>(`${path}${query}`, {
      responseType: 'blob',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  async function exportPdf(role?: string) {
    exportingPdf.value = true

    try {
      const query = role ? `?role=${encodeURIComponent(role)}` : ''
      await downloadFile(
        `/tournaments/${tournamentId}/badges/export/pdf`,
        query,
        `badges-${tournamentId}${role ? `-${role}` : ''}.pdf`,
      )
    } catch (err: any) {
      console.error(err)
      alert(err?.data?.message || err?.message || 'Failed to export PDF')
    } finally {
      exportingPdf.value = false
    }
  }

  async function exportExcel(role?: string) {
    exportingExcel.value = true

    try {
      const query = role ? `?role=${encodeURIComponent(role)}` : ''
      await downloadFile(
        `/tournaments/${tournamentId}/badges/export/excel`,
        query,
        `badges-${tournamentId}${role ? `-${role}` : ''}.xlsx`,
      )
    } catch (err: any) {
      console.error(err)
      alert(err?.data?.message || err?.message || 'Failed to export Excel')
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