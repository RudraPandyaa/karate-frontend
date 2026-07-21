import {
  io,
  type Socket,
} from 'socket.io-client'

export interface LiveMatch {
  id: string
  round: string
  status: string
  redScore: number
  blueScore: number
  timeRemaining: number
  senshu: 'NONE' | 'RED' | 'BLUE'

  redAthlete: {
    id: string
    name: string
    photoUrl?: string | null
  } | null

  blueAthlete: {
    id: string
    name: string
    photoUrl?: string | null
  } | null

  scoreEvents: any[]
}

export function useLiveMatch(
  matchId: string,
) {
  const { api } = useApi()
  const config = useRuntimeConfig()

  const match =
    ref<LiveMatch | null>(null)

  const pending =
    ref(true)

  const error =
    ref<string | null>(null)

  let socket: Socket | null = null

  async function fetchMatch() {
    try {
      match.value =
        await api<LiveMatch>(
          `/scoring/${matchId}/live`,
        )

      error.value = null
    } catch (err: any) {
      error.value =
        err?.data?.message ||
        err?.message ||
        'Unable to load match'
    } finally {
      pending.value = false
    }
  }

  function connect() {
    socket = io(
      `${config.public.apiBase}/scoring`,
      {
        transports: ['websocket'],
      },
    )

    socket.on('connect', () => {
      console.log(
        'Live scoreboard connected',
      )

      socket?.emit(
        'joinMatch',
        {
          matchId,
        },
      )
    })

    socket.on(
      'scoreUpdated',
      (data: any) => {
        if (!match.value) return

        if (data.match) {
          match.value = {
            ...match.value,
            ...data.match,
          }
        }
      },
    )

    socket.on(
      'timerUpdate',
      (data: any) => {
        if (!match.value) return

        match.value.timeRemaining =
          data.timeRemaining
      },
    )

    socket.on(
      'timerStarted',
      () => {
        if (!match.value) return

        match.value.status =
          'IN_PROGRESS'
      },
    )

    socket.on(
      'timerPaused',
      () => {
        if (!match.value) return

        match.value.status =
          'PAUSED'
      },
    )

    socket.on(
      'timerEnded',
      () => {
        if (!match.value) return

        match.value.status =
          'COMPLETED'

        match.value.timeRemaining =
          0
      },
    )

    socket.on(
      'timerAdjusted',
      (data: any) => {
        if (!match.value) return

        match.value.timeRemaining =
          data.timeRemaining
      },
    )
  }

  onMounted(async () => {
    await fetchMatch()
    connect()
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