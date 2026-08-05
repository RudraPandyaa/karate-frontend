import type { Role } from '~/types'

const SCORING_ROLES: Role[] = ['ADMIN', 'SUPER_ADMIN', 'REFEREE', 'SCOREKEEPER', 'OPERATOR']

export function getLiveMatchPath(matchId: string, role?: Role | null): string {
  if (role && SCORING_ROLES.includes(role)) {
    return `/scoring-control/${matchId}`
  }
  return `/live/${matchId}`
}