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
      console.log('scoreUpdated:', data)

      if (!match.value) return

      if (data.match) {
        match.value = {
          ...match.value,
          ...data.match,
        }
      }

      showNotification('Score updated')
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
        data.timeRemaining
    })

    socket.on('timerAdjusted', (data: any) => {
      if (!match.value) return

      match.value.timeRemaining =
        data.timeRemaining

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

  async function recordScore(
    corner: 'RED' | 'BLUE',
    type: ScoreTypeValue,
  ) {
    submitting.value = true
    submitError.value = null

    try {
      const result = await api(
        '/scoring/exchange',
        {
          method: 'POST',
          body: {
            matchId,
            entries: [
              {
                corner,
                type,
              },
            ],
          },
        },
      )

      return result
    } catch (err: any) {
      submitError.value =
        err?.data?.message ||
        err?.message ||
        'Failed to record score'

      throw err
    } finally {
      submitting.value = false
    }
  }

  async function undoScore(
    scoreEventId: string,
  ) {
    submitting.value = true
    submitError.value = null

    try {
      return await api(
        '/scoring/undo',
        {
          method: 'DELETE',
          body: {
            matchId,
            scoreEventId,
          },
        },
      )
    } catch (err: any) {
      submitError.value =
        err?.data?.message ||
        err?.message ||
        'Failed to undo score'

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
  recordScore,
  undoScore,
  startTimer,
  pauseTimer,
  adjustTime,
}
}