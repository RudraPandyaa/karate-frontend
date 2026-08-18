import {
  io,
  type Socket,
} from 'socket.io-client'

import type { LiveMatch } from '~/composables/useLiveMatch'

export type ScoreTypeValue =
  | 'YUKO'
  | 'WAZA_ARI'
  | 'IPPON'

export function useScoringAdmin(
  matchId: string,
) {
  const { api } = useApi()
  const { accessToken } = useAuth()
  const config = useRuntimeConfig()

  const match =
    ref<LiveMatch | null>(null)

  const pending = ref(true)

  const submitting = ref(false)

  const submitError =
    ref<string | null>(null)

  const lastScoreEventId =
    ref<string | null>(null)

  const notification =
    ref('')

  const notificationType =
    ref<
      'success' | 'error' | 'info'
    >('info')

  const restarting =
    ref(false)

  let socket: Socket | null = null

  let notificationTimeout:
    | ReturnType<typeof setTimeout>
    | null = null

  let flashTimeout:
    | ReturnType<typeof setTimeout>
    | null = null

  // =========================================================
  // SCORE FLASH
  // =========================================================

  const lastScoreFlash =
    ref<{
      corner: 'RED' | 'BLUE'
      type:
        | 'YUKO'
        | 'WAZA_ARI'
        | 'IPPON'
    } | null>(null)

  function triggerFlash(
    data: any,
  ) {
    const last =
      data?.exchange?.[
        data.exchange.length - 1
      ] ||
      data?.lastScore ||
      (data?.scoreEvents as any[])
        ?.filter(
          (e) => !e.wasUndone,
        )
        ?.slice(-1)?.[0] ||
      null

    if (
      !last?.corner ||
      !last?.type
    ) {
      return
    }

    if (
      ![
        'YUKO',
        'WAZA_ARI',
        'IPPON',
      ].includes(last.type)
    ) {
      return
    }

    lastScoreFlash.value = {
      corner: last.corner,
      type: last.type,
    }

    if (flashTimeout) {
      clearTimeout(
        flashTimeout,
      )
    }

    flashTimeout =
      setTimeout(() => {
        lastScoreFlash.value =
          null
      }, 1800)
  }

  // =========================================================
  // NOTIFICATION
  // =========================================================

  function showNotification(
    message: string,
    type:
      | 'success'
      | 'error'
      | 'info' = 'info',
  ) {
    notification.value =
      message

    notificationType.value =
      type

    if (notificationTimeout) {
      clearTimeout(
        notificationTimeout,
      )
    }

    notificationTimeout =
      setTimeout(() => {
        notification.value = ''
      }, 3000)
  }

  // =========================================================
  // INITIAL STATE
  // =========================================================

  async function loadInitialState() {
    pending.value = true
    submitError.value = null

    try {
      const data =
        await api<LiveMatch>(
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

  // =========================================================
  // TIME HELPER
  // =========================================================

  function clampTime(
    value: unknown,
  ): number {
    const time =
      Number(value)

    if (
      !Number.isFinite(time)
    ) {
      return 0
    }

    return Math.max(
      0,
      Math.floor(time),
    )
  }

  // =========================================================
  // SOCKET CONNECTION
  // =========================================================

  function connect() {
    if (!accessToken.value) {
      submitError.value =
        'Authentication required'

      showNotification(
        'Please log in to control this match',
        'error',
      )

      return
    }

    // Disconnect an existing socket
    if (socket) {
      socket.disconnect()
      socket = null
    }

    socket = io(
      `${config.public.apiBase}/scoring`,
      {
        transports: [
          'websocket',
        ],

        // IMPORTANT:
        // Send the same JWT used by HTTP authentication.
        auth: {
          token:
            accessToken.value,
        },

        // Prevent Socket.IO from
        // silently falling back to polling.
        upgrade: false,
      },
    )

    // =======================================================
    // CONNECTED
    // =======================================================

    socket.on(
      'connect',
      () => {
        console.log(
          '🔌 Admin scoring socket connected',
        )

        submitError.value = null

        socket?.emit(
          'joinMatch',
          {
            matchId,
          },
        )
      },
    )

    // =======================================================
    // CONNECT ERROR
    // =======================================================

    socket.on(
      'connect_error',
      (error) => {
        console.error(
          '[scoring socket] connection error:',
          error,
        )

        submitError.value =
          error?.message ||
          'Unable to connect to scoring server'

        showNotification(
          submitError.value,
          'error',
        )
      },
    )

    // =======================================================
    // AUTH ERROR
    // =======================================================

    socket.on(
      'authError',
      (data: any) => {
        const message =
          data?.message ||
          'Authentication failed'

        submitError.value =
          message

        showNotification(
          message,
          'error',
        )

        socket?.disconnect()
      },
    )

    // =======================================================
    // GENERAL SCORING ERROR
    // =======================================================

    socket.on(
      'scoringError',
      (data: any) => {
        const message =
          data?.message ||
          'Scoring operation failed'

        submitError.value =
          message

        showNotification(
          message,
          'error',
        )

        submitting.value =
          false

        restarting.value =
          false
      },
    )

    // =======================================================
    // JOINED
    // =======================================================

    socket.on(
      'joined',
      (data: any) => {
        console.log(
          'Joined scoring room:',
          data,
        )
      },
    )

    // =======================================================
    // SCORE UPDATED
    // =======================================================

    socket.on(
      'scoreUpdated',
      (data: any) => {
        if (!match.value) {
          return
        }

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
          data?.exchange?.[
            data.exchange.length - 1
          ]?.id ||
          data?.scoreEvents?.[
            data.scoreEvents.length - 1
          ]?.id ||
          null

        if (eventId) {
          lastScoreEventId.value =
            eventId
        }

        // Only flash for actual score exchanges.
        if (
          data.exchange?.length
        ) {
          triggerFlash(data)
        }

        submitting.value =
          false

        showNotification(
          data.message ||
            'Score updated',
          'success',
        )
      },
    )

    // =======================================================
    // TIMER STARTED
    // =======================================================

    socket.on(
      'timerStarted',
      () => {
        if (!match.value) {
          return
        }

        const wasPaused =
          match.value.status ===
          'PAUSED'

        match.value.status =
          'IN_PROGRESS'

        showNotification(
          wasPaused
            ? '▶ Match Resumed'
            : '▶ Match Started',
          'success',
        )
      },
    )

    // =======================================================
    // TIMER PAUSED
    // =======================================================

    socket.on(
      'timerPaused',
      () => {
        if (!match.value) {
          return
        }

        match.value.status =
          'PAUSED'

        showNotification(
          '⏸ Match Paused',
          'info',
        )
      },
    )

    // =======================================================
    // MATCH RESTARTED
    // =======================================================

    socket.on(
      'matchRestarted',
      (data: any) => {
        restarting.value =
          false

        submitting.value =
          false

        if (!match.value) {
          return
        }

        match.value = {
          ...match.value,
          ...data,

          scoreEvents: [],

          penalties: {
            red: {
              chui: 0,
              hansokuChui: 0,
              hansoku: 0,
            },

            blue: {
              chui: 0,
              hansokuChui: 0,
              hansoku: 0,
            },
          },
        }

        lastScoreEventId.value =
          null

        lastScoreFlash.value =
          null

        showNotification(
          'Match restarted',
          'success',
        )
      },
    )

    // =======================================================
    // TIMER ENDED
    // =======================================================

    socket.on(
      'timerEnded',
      (data: any) => {
        if (!match.value) {
          return
        }

        match.value.status =
          'COMPLETED'

        match.value.timeRemaining =
          0

        if (data.match) {
          match.value = {
            ...match.value,
            ...data.match,
          }
        }

        submitting.value =
          false

        showNotification(
          '🏁 Time Up',
          'info',
        )
      },
    )

    // =======================================================
    // TIMER UPDATE
    // =======================================================

    socket.on(
      'timerUpdate',
      (data: any) => {
        if (!match.value) {
          return
        }

        // Ignore old timer events while restarting.
        if (restarting.value) {
          return
        }

        match.value.timeRemaining =
          clampTime(
            data.timeRemaining,
          )
      },
    )

    // =======================================================
    // TIMER ADJUSTED
    // =======================================================

    socket.on(
      'timerAdjusted',
      (data: any) => {
        if (!match.value) {
          return
        }

        match.value.timeRemaining =
          clampTime(
            data.timeRemaining,
          )

        showNotification(
          data.message ||
            'Timer adjusted',
          'success',
        )
      },
    )

    // =======================================================
    // TIMER ADJUSTMENT REJECTED
    // =======================================================

    socket.on(
      'timerAdjustmentRejected',
      (data: any) => {
        showNotification(
          data?.message ||
            'Timer adjustment rejected',
          'error',
        )
      },
    )

    // =======================================================
    // PENALTY UPDATED
    // =======================================================

    socket.on(
      'penaltyUpdated',
      (data: any) => {
        if (!match.value) {
          return
        }

        if (data.match) {
          match.value = {
            ...match.value,
            ...data.match,

            penalties:
              data.penalties ??
              match.value.penalties,
          }
        }

        submitting.value =
          false

        showNotification(
          data.hansoku
            ? 'Hansoku — match ended'
            : 'Penalty recorded',
          data.hansoku
            ? 'error'
            : 'info',
        )
      },
    )
  }

  // =========================================================
  // DISCONNECT
  // =========================================================

  function disconnect() {
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
      socket = null
    }
  }

  // =========================================================
  // RECORD SCORE
  // =========================================================

  function recordScore(
    corner:
      | 'RED'
      | 'BLUE',
    type: ScoreTypeValue,
  ) {
    if (!socket?.connected) {
      showNotification(
        'Scoring connection is not available',
        'error',
      )

      return
    }

    submitError.value =
      null

    submitting.value =
      true

    socket.emit(
      'recordExchange',
      {
        matchId,

        entries: [
          {
            corner,
            type,
          },
        ],
      },
    )
  }

  // =========================================================
  // RECORD PENALTY
  // =========================================================

  function recordPenalty(
    corner:
      | 'RED'
      | 'BLUE',
    type:
      | 'CHUI'
      | 'HANSOKU_CHUI'
      | 'HANSOKU',
  ) {
    if (!socket?.connected) {
      showNotification(
        'Scoring connection is not available',
        'error',
      )

      return
    }

    submitError.value =
      null

    submitting.value =
      true

    socket.emit(
      'recordPenalty',
      {
        matchId,
        corner,
        type,
      },
    )
  }

  // =========================================================
  // UNDO LAST SCORE
  // =========================================================

  function undoLastScore() {
    if (
      !lastScoreEventId.value
    ) {
      showNotification(
        'No score to undo',
        'error',
      )

      return
    }

    if (!socket?.connected) {
      showNotification(
        'Scoring connection is not available',
        'error',
      )

      return
    }

    submitting.value =
      true

    submitError.value =
      null

    socket.emit(
      'undoScore',
      {
        matchId,
        scoreEventId:
          lastScoreEventId.value,
      },
    )

    // Don't clear the event ID until
    // the server confirms the operation.
  }

  // =========================================================
  // UNDO SPECIFIC SCORE
  // =========================================================

  async function undoScore(
    scoreEventId: string,
  ) {
    if (!socket?.connected) {
      const error =
        new Error(
          'Scoring connection is not available',
        )

      submitError.value =
        error.message

      showNotification(
        error.message,
        'error',
      )

      throw error
    }

    submitting.value =
      true

    submitError.value =
      null

    socket.emit(
      'undoScore',
      {
        matchId,
        scoreEventId,
      },
    )
  }

  // =========================================================
  // START TIMER
  // =========================================================

  function startTimer() {
    if (!socket?.connected) {
      showNotification(
        'Scoring connection is not available',
        'error',
      )

      return
    }

    socket.emit(
      'startTimer',
      {
        matchId,
      },
    )
  }

  // =========================================================
  // PAUSE TIMER
  // =========================================================

  function pauseTimer() {
    if (!socket?.connected) {
      showNotification(
        'Scoring connection is not available',
        'error',
      )

      return
    }

    socket.emit(
      'pauseTimer',
      {
        matchId,
      },
    )
  }

  // =========================================================
  // ADJUST TIME
  // =========================================================

  function adjustTime(
    deltaSeconds: number,
  ) {
    if (!socket?.connected) {
      showNotification(
        'Scoring connection is not available',
        'error',
      )

      return
    }

    socket.emit(
      'adjustTime',
      {
        matchId,
        deltaSeconds,
      },
    )
  }

  // =========================================================
  // LOCAL RESTART STATE
  // =========================================================

  function applyRestartLocally() {
    if (!match.value) return

    const fullTime =
      (match.value as any).timerSeconds ??
      match.value.timeRemaining ??
      180

    match.value = {
      ...match.value,
      status: 'SCHEDULED',
      redScore: 0,
      blueScore: 0,
      timeRemaining: fullTime,
      senshu: 'NONE' as any,
      winnerId: null,
      resultType: null,
      startedAt: null,
      completedAt: null,
      scoreEvents: [],
      penalties: {
        red: { chui: 0, hansokuChui: 0, hansoku: 0 },
        blue: { chui: 0, hansokuChui: 0, hansoku: 0 },
      },

      ...( {
        senshuLocked: false,
      } as any ),
    } as typeof match.value

    lastScoreEventId.value = null
    lastScoreFlash.value = null
    showNotification('Match restarting...', 'info')
  }

  // =========================================================
  // RESTART MATCH
  // =========================================================

  async function restartMatch() {
    if (!match.value) {
      return
    }

    if (
      !socket?.connected
    ) {
      showNotification(
        'Scoring connection is not available',
        'error',
      )

      return
    }

    if (
      !confirm(
        'Restart this match? Scores, penalties and timer will be reset.',
      )
    ) {
      return
    }

    const snapshot =
      JSON.parse(
        JSON.stringify(
          match.value,
        ),
      )

    restarting.value =
      true

    submitting.value =
      true

    submitError.value =
      null

    // Instant local UI
    applyRestartLocally()

    socket.emit(
      'restartMatch',
      {
        matchId,
      },
    )

    // Do NOT rollback here.
    //
    // socket.emit() does not throw when the
    // server later rejects the operation.
    //
    // The server will respond with either:
    //   matchRestarted
    // or
    //   scoringError
    //
    // If scoringError occurs, restore snapshot.
    //
    // Store it temporarily for the error handler.
    restartSnapshot.value =
      snapshot
  }

  const restartSnapshot =
    ref<LiveMatch | null>(null)

  // =========================================================
  // HANDLE SERVER SCORING ERROR FOR RESTART
  // =========================================================

  // We need a second scoringError listener specifically
  // for rollback. The general listener above also handles
  // the notification.
  //
  // Replace the general listener's behavior with this
  // additional handler.
  //
  // Socket.IO allows multiple listeners for the same event.

  // =========================================================
  // MOUNT / UNMOUNT
  // =========================================================

  onMounted(async () => {
    await loadInitialState()
    connect()
  })

  onUnmounted(() => {
    disconnect()

    if (notificationTimeout) {
      clearTimeout(
        notificationTimeout,
      )
    }

    if (flashTimeout) {
      clearTimeout(
        flashTimeout,
      )
    }
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

    restartMatch,
  }
}