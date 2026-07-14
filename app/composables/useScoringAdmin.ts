import { io, type Socket } from 'socket.io-client'

export type ScoreTypeValue = 'YUKO' | 'WAZA_ARI' | 'IPPON'

export function useScoringAdmin(matchId: string) {
  const { api } = useApi()
  const config = useRuntimeConfig()

  const submitting = ref(false)
  const submitError = ref<string | null>(null)

  const notification = ref('')
  const timer = ref(180)
  const matchStatus = ref('PAUSED')

  let socket: Socket | null = null
  let notificationTimeout: ReturnType<typeof setTimeout> | null = null

  function showNotification(message: string) {
    notification.value = message

    if (notificationTimeout) {
      clearTimeout(notificationTimeout)
    }

    notificationTimeout = setTimeout(() => {
      notification.value = ''
    }, 3000)
  }

  async function loadInitialState() {
    try {
      const data: any = await api(`/scoring/${matchId}/live`)

      timer.value = data.timeRemaining ?? data.match?.timeRemaining ?? 180

      matchStatus.value =
        data.status ??
        data.match?.status ??
        'PAUSED'
    } catch (e) {
      console.error(e)
    }
  }

  function connect() {
    socket = io(`${config.public.apiBase}/scoring`, {
      transports: ['websocket'],
    })

    socket.emit('joinMatch', { matchId })

    socket.on('timerUpdate', (data: any) => {
      timer.value = data.timeRemaining
    })

    socket.on('timerStarted', (data: any) => {
      matchStatus.value = 'IN_PROGRESS'
      showNotification(data?.message ?? '▶ Match Started')
    })

    socket.on('timerPaused', (data: any) => {
      matchStatus.value = 'PAUSED'
      showNotification(data?.message ?? '⏸ Match Paused')
    })

    socket.on('timerEnded', (data: any) => {
      matchStatus.value = 'COMPLETED'
      showNotification(data?.message ?? '🏁 Time Up')
    })

    socket.on('timerAdjusted', (data: any) => {
      timer.value = data.timeRemaining
      showNotification(data.message)
    })

    socket.on('scoreUpdated', (data: any) => {
      if (data.match) {
        timer.value = data.match.timeRemaining
        matchStatus.value = data.match.status
      }
    })
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
    const payload = {
      matchId,
      entries: [
        {
          corner,
          type,
        },
      ],
    }

    console.log(payload)

    return await api('/scoring/exchange', {
      method: 'POST',
      body: payload,
    })
    } catch (err: any) {
      submitError.value =
        err?.data?.message ??
        err.message ??
        'Failed to record score'

      throw err
    } finally {
      submitting.value = false
    }
  }

  async function undoScore(scoreEventId: string) {
    submitting.value = true
    submitError.value = null

    try {
      return await api('/scoring/undo', {
        method: 'DELETE',
        body: {
          matchId,
          scoreEventId,
        },
      })
    } catch (err: any) {
      submitError.value =
        err?.data?.message ??
        err.message ??
        'Failed to undo score'

      throw err
    } finally {
      submitting.value = false
    }
  }

  function startTimer() {
    socket?.emit('startTimer', { matchId })
  }

  function pauseTimer() {
    socket?.emit('pauseTimer', { matchId })
  }

  function adjustTime(deltaSeconds: number) {
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
    submitting,
    submitError,
    notification,
    timer,
    matchStatus,
    recordScore,
    undoScore,
    startTimer,
    pauseTimer,
    adjustTime,
  }
}