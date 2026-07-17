import type { TournamentStatus, TournamentDisplayStatus } from '~/types'

export function deriveDisplayStatus(t: {
  status: TournamentStatus
  startDate: string
}): TournamentDisplayStatus {
  if (t.status === 'DRAFT') {
    return new Date(t.startDate) > new Date() ? 'UPCOMING' : 'DRAFT'
  }
  if (t.status === 'ONGOING') return 'LIVE'
  if (t.status === 'COMPLETED') return 'COMPLETED'
  return 'CANCELLED'
}