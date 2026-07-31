import { io, type Socket } from 'socket.io-client'
import type { LiveMatch } from '~/composables/useLiveMatch'

export type ScoreTypeValue =
  | 'YUKO'
  | 'WAZA_ARI'
  | 'IPPON'

export function useScoringAdmin(matchId: string) {
  const { api } = useApi()
  const config = useRuntimeConfig()

  const match = ref<LiveMatch | null>(null)

  const pending = ref(true)
  const submitting = ref(false)
  const submitError = ref<string | null>(null)
  const lastScoreEventId = ref<string | null>(null) 
  const notification = ref('')
  const notificationType = ref<'success' | 'error' | 'info'>('info')    

  let socket: Socket | null = null
  let notificationTimeout: ReturnType<typeof setTimeout> | null = null

  function showNotification(
    message: string,
    type: 'success' | 'error' | 'info' = 'info',
  ) {
    notification.value = message
    notificationType.value = type

    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
    }

    notificationTimeout = setTimeout(() => {
      notification.value = ''
    }, 3000)
  }

  async function loadInitialState() {
    try {
      const data = await api<LiveMatch>(
        `/scoring/${matchId}/live`,
      )

      match.value = data
    } catch (err: any) {
      submitError.value =
        err?.data?.message ||
        err?.message ||
        'Failed to load match'
    } finally {
      pending.value = false
    }
  }

  function clampTime(value: unknown): number {
    const time = Number(value)

    if (!Number.isFinite(time)) {
      return 0
    }

    return Math.max(0, Math.floor(time))
  }

  function connect() {
    socket = io(
      `${config.public.apiBase}/scoring`,
      {
        transports: ['websocket'],
      },
    )

    socket.on('connect', () => {
      console.log('Admin socket connected')

      socket?.emit('joinMatch', {
        matchId,
      })
    })


    // inside connect(), scoreUpdated handler:
    socket.on('scoreUpdated', (data: any) => {
      if (!match.value) return

      // merge match state
      if (data.match) {
        match.value = {
          ...match.value,
          ...data.match,
        }
      } else {
        // some backends send the match fields at top level
        match.value = {
          ...match.value,
          ...data,
        }
      }

      // Try multiple possible payload shapes for last event id
      const eventId =
        data?.lastScoreEventId ||
        data?.scoreEvent?.id ||
        data?.exchange?.[data.exchange.length - 1]?.id ||
        data?.scoreEvents?.[data.scoreEvents.length - 1]?.id ||
        data?.events?.[data.events.length - 1]?.id ||
        null

      if (eventId) {
        lastScoreEventId.value = eventId
      }

      showNotification('Score updated', 'success')
    })

  socket.on('timerStarted', () => {
    if (!match.value) return

    match.value.status = 'IN_PROGRESS'

    showNotification(
      match.value.timeRemaining < 180
        ? '▶ Match Resumed'
        : '▶ Match Started',
      'success',
    )
  })


    socket.on('timerPaused', () => {
      if (!match.value) return

      match.value.status = 'PAUSED'

      showNotification(
        '⏸ Match Paused',
        'info',
      )
    })

    socket.on('timerEnded', (data: any) => {
      if (!match.value) return

      match.value.status = 'COMPLETED'
      match.value.timeRemaining = 0

      if (data.match) {
        match.value = {
          ...match.value,
          ...data.match,
        }
      }

      showNotification('🏁 Time Up')
    })

    socket.on('timerUpdate', (data: any) => {
      if (!match.value) return

      match.value.timeRemaining =
        clampTime(data.timeRemaining)
    })

    socket.on('timerAdjusted', (data: any) => {
      if (!match.value) return

      match.value.timeRemaining =
          clampTime(data.timeRemaining)

      showNotification(
        data.message,
        'success',
      )
    })

    socket.on(
      'timerAdjustmentRejected',
      (data: any) => {
        showNotification(
          data.message,
          'error',
        )
      },
    )
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
  }

  function recordScore(
    corner: 'RED' | 'BLUE',
    type: ScoreTypeValue,
  ) {
    submitError.value = null

    socket?.emit('recordExchange', {
      matchId,
      entries: [
        {
          corner,
          type,
        },
      ],
    })
  }

  function undoLastScore() {
    if (!lastScoreEventId.value) {
      showNotification('No score to undo', 'error')
      return
    }

    submitting.value = true
    submitError.value = null

    socket?.emit('undoScore', {
      matchId,
      scoreEventId: lastScoreEventId.value,
    })

    // optimistic clear; will refresh on scoreUpdated
    lastScoreEventId.value = null
    submitting.value = false
  }

  async function undoScore(scoreEventId: string) {
    submitting.value = true
    submitError.value = null
    try {
      // Prefer socket
      socket?.emit('undoScore', {
        matchId,
        scoreEventId,
      })
      lastScoreEventId.value = null
    } catch (err: any) {
      submitError.value =
        err?.data?.message || err?.message || 'Failed to undo score'
      throw err
    } finally {
      submitting.value = false
    }
  }

  function startTimer() {
    socket?.emit('startTimer', {
      matchId,
    })
  }

  function pauseTimer() {
    socket?.emit('pauseTimer', {
      matchId,
    })
  }

  function adjustTime(
    deltaSeconds: number,
  ) {
    socket?.emit('adjustTime', {
      matchId,
      deltaSeconds,
    })
  }

  onMounted(async () => {
    await loadInitialState()
    connect()
  })

  onUnmounted(() => {
    disconnect()

    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
    }
  })

return {
  match,
  pending,
  submitting,
  submitError,
  notification,
  notificationType,
  lastScoreEventId,
  recordScore,
  undoScore,
  undoLastScore,
  startTimer,
  pauseTimer,
  adjustTime,
}
}