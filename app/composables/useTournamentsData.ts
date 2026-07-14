export function useTournamentsData() {
  const { api } = useApi()

  const rows = ref<any[]>([])
  const stats = ref({
    totalEvents: 0,
    activeNow: 0,
    registeredAthletes: 0,
  })
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    pending.value = true
    error.value = null
    try {
      const data = await api<any[]>('/tournaments')
      rows.value = data
      console.log('✅ Loaded real tournaments:', data) // Add this line
    } catch (e: any) {
      error.value = `API Error: ${e.message}. Check backend is running on correct port.`
      console.error('Tournaments API failed:', e)
    } finally {
      pending.value = false
    }
  }

  async function createTournament(payload: any) {
    return api('/tournaments', { method: 'POST', body: payload })
  }

  return { rows, stats, pending, error, fetchAll, createTournament }
}