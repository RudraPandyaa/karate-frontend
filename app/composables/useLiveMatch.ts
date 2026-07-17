import { io, type Socket } from 'socket.io-client'

export interface LiveMatch {
  id: string
  round: string
  status: string
  redScore: number
  blueScore: number
  timeRemaining: number
  senshu: 'NONE' | 'RED' | 'BLUE'

  isRunning?: boolean

  redAthlete: {
    id: string
    name: string
    photoUrl?: string | null   // ← Add this
  } | null

  blueAthlete: {
    id: string
    name: string
    photoUrl?: string | null   // ← Add this
  } | null

  scoreEvents: any[]
}

export function useLiveMatch(matchId: string) {
  const { api } = useApi()

  const match = ref<LiveMatch | null>(null)
  const pending = ref(true)
  const error = ref<string | null>(null)

  let socket: Socket | null = null

  async function fetchMatch() {
    try {
      match.value = await api<LiveMatch>(`/scoring/${matchId}/live`)
      error.value = null
    } catch (err: any) {
      error.value = err?.data?.message || err.message || 'Unable to load match'
    } finally {
      pending.value = false
    }
  }

  onMounted(async () => {
    await fetchMatch()

    socket = io('http://localhost:3001/scoring', {
      transports: ['websocket'],
    })

    socket.emit('joinMatch', { matchId })

    socket.on('scoreUpdated', (data: any) => {
      console.log('scoreUpdated', data)
      match.value = data.match ?? data
    })

    socket.on('timerUpdate', (data: any) => {
      if (!match.value) return
      match.value.timeRemaining = data.timeRemaining
    })

    socket.on('timerStarted', () => {
      if (!match.value) return
      match.value.status = 'IN_PROGRESS'
    })

    socket.on('timerPaused', () => {
      if (!match.value) return
      match.value.status = 'PAUSED'
    })

    socket.on('timerEnded', () => {
      if (!match.value) return
      match.value.status = 'COMPLETED'
      match.value.timeRemaining = 0
    })
  })

  onUnmounted(() => {
    socket?.disconnect()
  })

  return {
    match,
    pending,
    error,
  }
}