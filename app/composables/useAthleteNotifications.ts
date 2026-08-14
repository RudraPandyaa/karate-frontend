import { computed, watch } from 'vue'
import { useAthleteDashboard } from '~/composables/useAthleteDashboard'
import { useApi } from '~/composables/useApi'

export type AthleteAlert = {
  id: string
  type: 'live' | 'upcoming' | 'server'
  title: string
  body: string
  to: string
  createdAt: number
  serverId?: string
  read?: boolean
}

type ServerNotification = {
  id: string
  type: string
  title: string
  body: string
  link?: string | null
  readAt?: string | null
  meta?: { matchId?: string } | null
  createdAt: string
}

function athleteName(a?: any) {
  if (!a) return 'TBD'
  return (
    a.fullName ||
    [a.firstName, a.lastName].filter(Boolean).join(' ') ||
    a.name ||
    'TBD'
  )
}

export function useAthleteNotifications() {
  const { api } = useApi()
  const { dashboard, fetchDashboard } = useAthleteDashboard()

  const serverItems = useState<ServerNotification[]>(
    'athlete-server-notifications',
    () => [],
  )
  const serverUnread = useState<number>('athlete-server-unread', () => 0)

  const dismissed = useState<string[]>('athlete-alert-dismissed', () => {
    if (import.meta.client) {
      try {
        const raw = localStorage.getItem('athlete-alert-dismissed')
        return raw ? JSON.parse(raw) : []
      } catch {
        return []
      }
    }
    return []
  })

  const open = useState('athlete-alerts-open', () => false)
  const loading = useState('athlete-alerts-loading', () => false)

  const derivedAlerts = computed<AthleteAlert[]>(() => {
    const list: AthleteAlert[] = []
    const d = dashboard.value
    if (!d) return list

    const athleteId = d.athlete?.id
    const liveIds = new Set((d.liveMatches ?? []).map((m) => m.id))

    for (const m of d.liveMatches ?? []) {
      const opponent =
        m.redAthlete?.id === athleteId ? m.blueAthlete : m.redAthlete
      list.push({
        id: `live-${m.id}`,
        type: 'live',
        title: 'Match is LIVE',
        body: `vs ${athleteName(opponent)} · ${m.redScore ?? 0}–${m.blueScore ?? 0}${
          m.tatami ? ` · Tatami ${m.tatami.number}` : ''
        }`,
        to: `/live-scoring/${m.id}`,
        createdAt: Date.now(),
      })
    }

    const next = (d.upcomingMatches ?? [])[0]
    if (next && liveIds.size === 0) {
      const opponent =
        next.redAthlete?.id === athleteId ? next.blueAthlete : next.redAthlete
      list.push({
        id: `up-${next.id}`,
        type: 'upcoming',
        title: 'Next match',
        body: `vs ${athleteName(opponent)}${
          next.tatami ? ` · Tatami ${next.tatami.number}` : ''
        } · ${next.category?.name || 'Category'}`,
        to: `/live-scoring/${next.id}`,
        createdAt: Date.now(),
      })
    }

    return list.filter((a) => !dismissed.value.includes(a.id))
  })

  const serverAlerts = computed<AthleteAlert[]>(() => {
    const liveMatchIds = new Set(
      (dashboard.value?.liveMatches ?? []).map((m) => m.id),
    )

    return (serverItems.value ?? [])
      .filter((n) => !n.readAt)
      .filter((n) => {
        // Avoid duplicate "live" if derived already shows same match
        const matchId = (n.meta as any)?.matchId
        if (n.type === 'MATCH_LIVE' && matchId && liveMatchIds.has(matchId)) {
          return false
        }
        return true
      })
      .map((n) => ({
        id: `srv-${n.id}`,
        serverId: n.id,
        type: 'server' as const,
        title: n.title,
        body: n.body,
        to: n.link || '/athletes/matches',
        createdAt: new Date(n.createdAt).getTime(),
        read: !!n.readAt,
      }))
  })

  const alerts = computed(() => {
    const merged = [...derivedAlerts.value, ...serverAlerts.value]
    merged.sort((a, b) => b.createdAt - a.createdAt)
    return merged
  })

  const unreadCount = computed(() => {
    // derived + server unread (serverUnread may include ones we filtered)
    return alerts.value.length
  })

  async function fetchServerNotifications() {
    loading.value = true
    try {
      const res = await api<{ items: ServerNotification[]; unread: number }>(
        '/notifications',
      )
      serverItems.value = res.items ?? []
      serverUnread.value = res.unread ?? 0
    } catch {
      // Silent — derived alerts still work
    } finally {
      loading.value = false
    }
  }

  async function markServerRead(serverId: string) {
    try {
      await api(`/notifications/${serverId}/read`, { method: 'PATCH' })
      serverItems.value = serverItems.value.map((n) =>
        n.id === serverId ? { ...n, readAt: new Date().toISOString() } : n,
      )
      serverUnread.value = Math.max(0, serverUnread.value - 1)
    } catch {
      // ignore
    }
  }

  async function markAllServerRead() {
    try {
      await api('/notifications/read-all', { method: 'POST' })
      serverItems.value = serverItems.value.map((n) => ({
        ...n,
        readAt: n.readAt || new Date().toISOString(),
      }))
      serverUnread.value = 0
    } catch {
      // ignore
    }
  }

  function dismissLocal(id: string) {
    if (dismissed.value.includes(id)) return
    dismissed.value = [...dismissed.value, id]
    if (import.meta.client) {
      localStorage.setItem(
        'athlete-alert-dismissed',
        JSON.stringify(dismissed.value),
      )
    }
  }

  async function dismiss(alert: AthleteAlert) {
    if (alert.serverId) {
      await markServerRead(alert.serverId)
    } else {
      dismissLocal(alert.id)
    }
  }

  async function dismissAll() {
    await markAllServerRead()
    for (const a of derivedAlerts.value) {
      dismissLocal(a.id)
    }
    open.value = false
  }

  function toggle() {
    open.value = !open.value
  }

  function close() {
    open.value = false
  }

  watch(open, (v) => {
    if (v) {
      fetchDashboard()
      fetchServerNotifications()
    }
  })

  // Background poll for server notifications
  onMounted(() => {
    fetchServerNotifications()
    const timer = setInterval(() => {
      fetchServerNotifications()
    }, 30000)
    onUnmounted(() => clearInterval(timer))
  })

  return {
    alerts,
    unreadCount,
    open,
    loading,
    dismiss,
    dismissAll,
    toggle,
    close,
    fetchServerNotifications,
  }
}