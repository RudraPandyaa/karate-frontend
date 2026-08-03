import {
  io,
  type Socket,
} from 'socket.io-client'

export interface LiveScoreEvent {
  id: string
  corner: 'RED' | 'BLUE'
  type: 'YUKO' | 'WAZA_ARI' | 'IPPON'
  points: number
  timestamp: string
  wasUndone: boolean
}

export type ScoreFlash = {
  corner: 'RED' | 'BLUE'
  type: 'YUKO' | 'WAZA_ARI' | 'IPPON'
} | null

export interface PenaltySummary {
  chui: number
  hansokuChui: number
  hansoku: number
}

export interface LiveMatch {
  id: string
  round: string
  status: string
  redScore: number
  blueScore: number
  timeRemaining: number
  senshu: 'NONE' | 'RED' | 'BLUE'

  category?: {
    id: string
    name: string
    ageGroup?: string
    gender?: string
    discipline?: string
  } | null

  tatami?: {
    id: string
    number?: number
    name?: string | null
  } | null

  winnerId?: string | null
  resultType?: string | null
  completedAt?: string | null

  redAthlete: {
    id: string
    name?: string
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    photoUrl?: string | null
    country?: string | null
  } | null

  blueAthlete: {
    id: string
    name?: string
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    photoUrl?: string | null
    country?: string | null
  } | null

  scoreEvents: LiveScoreEvent[]

  penalties?: {
    red: PenaltySummary
    blue: PenaltySummary
  }
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

  const lastScoreFlash = ref<ScoreFlash>(null)
  let flashTimeout: ReturnType<typeof setTimeout> | null = null

  function triggerFlash(data: any) {
    const last =
      data?.exchange?.[data.exchange.length - 1] ||
      data?.lastScore ||
      null

    if (!last?.corner || !last?.type) return
    if (!['YUKO', 'WAZA_ARI', 'IPPON'].includes(last.type)) return

    lastScoreFlash.value = {
      corner: last.corner,
      type: last.type,
    }

    if (flashTimeout) clearTimeout(flashTimeout)
    flashTimeout = setTimeout(() => {
      lastScoreFlash.value = null
    }, 1800)
  }

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

    socket.on('scoreUpdated', (data: any) => {
      if (!match.value) return

      const incomingEvents =
        data.scoreEvents ??
        data.match?.scoreEvents ??
        null

      // Fallback: append exchange entries if backend only sends new ones
      let scoreEvents = match.value.scoreEvents ?? []

      if (incomingEvents) {
        scoreEvents = incomingEvents
      } else if (data.exchange?.length) {
        const mapped = data.exchange.map((e: any) => ({
          id: e.id,
          corner: e.corner,
          type: e.type,
          points: e.points,
          timestamp: e.timestamp ?? new Date().toISOString(),
          wasUndone: e.wasUndone ?? false,
        }))
        // only useful if exchange has corner/type (see Fix 1)
        scoreEvents = [...scoreEvents, ...mapped]
      }

      match.value = {
        ...match.value,
        ...(data.match ?? {}),
        scoreEvents,
        penalties:
          data.penalties ??
          data.match?.penalties ??
          match.value.penalties,
      }
      triggerFlash(data)
    })

    socket.on('penaltyUpdated', (data: any) => {
      if (!match.value) return
      match.value = {
        ...match.value,
        ...(data.match ?? {}),
        scoreEvents: data.scoreEvents ?? data.match?.scoreEvents ?? match.value.scoreEvents,
        penalties: data.penalties ?? data.match?.penalties ?? match.value.penalties,
      }
    })

    socket.on(
      'timerUpdate',
      (data: any) => {
        if (!match.value) return

        match.value.timeRemaining =
          Math.max(
            0,
            data.timeRemaining,
          )
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
      (data: any) => {
        if (!match.value) return

        match.value = {
          ...match.value,
          ...(data.match ?? {}),
          status: 'COMPLETED',
          timeRemaining: 0,
        }
      },
    )

    socket.on(
      'timerAdjusted',
      (data: any) => {
        if (!match.value) return

        match.value.timeRemaining =
          Math.max(
            0,
            data.timeRemaining,
          )
      },
    )
  }

  onMounted(async () => {
    await fetchMatch()
    connect()
  })

  onUnmounted(() => {
    socket?.disconnect()
    if (flashTimeout) clearTimeout(flashTimeout)
  })

  return {
    match,
    pending,
    error,
    lastScoreFlash,
  }
}