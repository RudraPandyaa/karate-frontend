export function useEventBadges(tournamentId: string) {
  const { api } = useApi()
  const config = useRuntimeConfig()

  const badges = ref<any[]>([])
  const loading = ref(false)
  const generating = ref(false)
  const exporting = ref(false)

  async function fetchBadges(role?: string) {
    loading.value = true
    try {
      badges.value = await api(`/tournaments/${tournamentId}/badges`, {
        query: role ? { role } : undefined,
      })
    } catch (err) {
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  async function generateBadges(role: string, referenceIds: string[]) {
    generating.value = true
    try {
      const result = await api(`/tournaments/${tournamentId}/badges/generate`, {
        method: 'POST',
        body: { role, referenceIds },
      })
      await fetchBadges(role)
      return result
    } finally {
      generating.value = false
    }
  }

  async function markPrinted(badgeIds: string[], role?: string) {
    await api(`/tournaments/${tournamentId}/badges/mark-printed`, {
      method: 'PATCH',
      body: { badgeIds },
    })
    await fetchBadges(role)
  }

  function getAccessToken(): string | null {
    return useCookie<string | null>('accessToken').value
  }

  async function downloadFile(path: string, filename: string) {
    const token = getAccessToken()
    if (!token) {
      throw new Error('Not authenticated. Please login again.')
    }

    const response = await fetch(`${config.public.apiBase}${path}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      let message = 'Download failed'
      try {
        const err = await response.json()
        message = err.message || message
      } catch {}
      throw new Error(message)
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  async function exportPdf(role?: string) {
    exporting.value = true
    try {
      const query = role ? `?role=${encodeURIComponent(role)}` : ''
      await downloadFile(
        `/tournaments/${tournamentId}/badges/export/pdf${query}`,
        `badges-${role || 'all'}.pdf`,
      )
    } catch (err: any) {
      alert(err?.message || 'PDF download failed')
    } finally {
      exporting.value = false
    }
  }

  async function exportExcel(role?: string) {
    exporting.value = true
    try {
      const query = role ? `?role=${encodeURIComponent(role)}` : ''
      await downloadFile(
        `/tournaments/${tournamentId}/badges/export/excel${query}`,
        `badges-${role || 'all'}.xlsx`,
      )
    } catch (err: any) {
      alert(err?.message || 'Excel download failed')
    } finally {
      exporting.value = false
    }
  }

  // THIS RETURN IS REQUIRED — without it the page crashes
  return {
    badges,
    loading,
    generating,
    exporting,
    fetchBadges,
    generateBadges,
    markPrinted,
    exportPdf,
    exportExcel,
  }
}