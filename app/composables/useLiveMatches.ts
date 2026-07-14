import { io, type Socket } from 'socket.io-client'

export type Senshu = 'NONE' | 'RED' | 'BLUE'

export interface LiveMatchSummary {
  id: string
  round: string
  status: string
  redScore: number
  blueScore: number
  timeRemaining: number
  redAthlete: { id: string; name: string } | null
  blueAthlete: { id: string; name: string } | null
  category: { id: string; name: string } | null
  tatami: { id: string; number: number } | null
}

export function useLiveMatches() {
  const { api } = useApi()

  const matches = ref<LiveMatchSummary[]>([])
  const pending = ref(true)
  const error = ref<string | null>(null)

  let interval: ReturnType<typeof setInterval> | null = null

  async function fetchLive() {
    try {
      matches.value = await api<LiveMatchSummary[]>('/scoring/live/all')
      error.value = null
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'Unable to load live matches'
    } finally {
      pending.value = false
    }
  }

  onMounted(() => {
    fetchLive()
    // Polling, not sockets — this is a landing page, not a single match room.
    // 5s is a reasonable balance between freshness and hammering the endpoint.
    interval = setInterval(fetchLive, 5000)
  })

  onUnmounted(() => {
    if (interval) clearInterval(interval)
  })

  return { matches, pending, error }
}