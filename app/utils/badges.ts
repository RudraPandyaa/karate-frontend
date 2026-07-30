export type BadgeRoleType = 'ATHLETE' | 'COACH' | 'OFFICIAL' | 'REFEREE'

export const ROLES: BadgeRoleType[] = ['ATHLETE', 'COACH', 'OFFICIAL', 'REFEREE']

export const ROLE_LABELS: Record<BadgeRoleType, string> = {
  ATHLETE: 'Athlete',
  COACH: 'Coach',
  OFFICIAL: 'Official',
  REFEREE: 'Referee',
}

export const ROLE_BADGE_CLASSES: Record<BadgeRoleType, string> = {
  ATHLETE: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  COACH: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  OFFICIAL: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  REFEREE: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
}

export function roleLabel(role?: string) {
  return ROLE_LABELS[role as BadgeRoleType] ?? role ?? '—'
}

export function roleBadgeClass(role?: string) {
  return ROLE_BADGE_CLASSES[role as BadgeRoleType] ?? 'bg-surface text-muted border-line'
}

export function formatPrintedAt(value?: string | Date | null) {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}