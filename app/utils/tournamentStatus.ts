import type { TournamentStatus, TournamentDisplayStatus } from '~/types'

export function deriveDisplayStatus(t: {
  status: TournamentStatus
  startDate: string
  endDate: string
}): TournamentDisplayStatus {
  // Explicit terminal state
  if (t.status === 'CANCELLED') return 'CANCELLED'

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const start = new Date(t.startDate)
  start.setHours(0, 0, 0, 0)

  const end = new Date(t.endDate)
  end.setHours(23, 59, 59, 999)

  // Date-based status (works even if DB still says DRAFT)
  if (today < start) return 'UPCOMING'
  if (today > end) return 'COMPLETED'
  return 'ONGOING' // start ≤ today ≤ end
}