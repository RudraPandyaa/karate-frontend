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

  function recordScore(
    corner: 'RED' | 'BLUE',
    type: ScoreTypeValue,
  ) {
    submitError.value = null
    socket?.emit('recordExchange', {
      matchId,
      entries: [{ corner, type }],
    })
  }

  // ✅ INSIDE the function — same scope as submitError + socket
  function recordPenalty(
    corner: 'RED' | 'BLUE',
    type: 'CHUI' | 'HANSOKU_CHUI' | 'HANSOKU',
  ) {
    submitError.value = null
    socket?.emit('recordPenalty', {
      matchId,
      corner,
      type,
    })
  }

  const lastScoreFlash = ref<{
  corner: 'RED' | 'BLUE'
  type: 'YUKO' | 'WAZA_ARI' | 'IPPON'
} | null>(null)

let flashTimeout: ReturnType<typeof setTimeout> | null = null

function triggerFlash(data: any) {
  const last =
    data?.exchange?.[data.exchange.length - 1] ||
    data?.lastScore ||
    // fallback: newest non-undone score event
    (data?.scoreEvents as any[])
      ?.filter((e) => !e.wasUndone)
      ?.slice(-1)?.[0] ||
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


    socket.on('scoreUpdated', (data: any) => {
      if (!match.value) return

      match.value = {
        ...match.value,
        ...(data.match ?? {}),
        scoreEvents:
          data.scoreEvents ??
          data.match?.scoreEvents ??
          match.value.scoreEvents,
        penalties:
          data.penalties ??
          data.match?.penalties ??
          match.value.penalties,
      }

      const eventId =
        data?.exchange?.[data.exchange.length - 1]?.id ||
        data?.scoreEvents?.[data.scoreEvents.length - 1]?.id ||
        null

      if (eventId) {
        lastScoreEventId.value = eventId
      }

      // Only flash on real new scores (has exchange), not undo-only payloads
      if (data.exchange?.length) {
        triggerFlash(data)
      }

      showNotification(
        data.message || 'Score updated',
        'success',
      )
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

    socket.on('penaltyUpdated', (data: any) => {
    if (!match.value) return

    if (data.match) {
      match.value = {
        ...match.value,
        ...data.match,
        penalties: data.penalties ?? match.value.penalties,
      }
    }

    showNotification(
      data.hansoku ? 'Hansoku — match ended' : 'Penalty recorded',
      data.hansoku ? 'error' : 'info',
    )
  })
  }

  function disconnect() {
    socket?.disconnect()
    socket = null
  }

  // function recordScore(
  //   corner: 'RED' | 'BLUE',
  //   type: ScoreTypeValue,
  // ) {
  //   submitError.value = null

  //   socket?.emit('recordExchange', {
  //     matchId,
  //     entries: [
  //       {
  //         corner,
  //         type,
  //       },
  //     ],
  //   })
  // }

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
    if (notificationTimeout) clearTimeout(notificationTimeout)
    if (flashTimeout) clearTimeout(flashTimeout)
  })

return {
  match,
  pending,
  submitting,
  submitError,
  notification,
  notificationType,
  lastScoreFlash,
  lastScoreEventId,
  recordPenalty,
  recordScore,
  undoScore,
  undoLastScore,
  startTimer,
  pauseTimer,
  adjustTime,
}
}