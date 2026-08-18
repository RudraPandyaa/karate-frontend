// composables/useTatamiSchedule.ts
//
// Given the matches on one tatami, works out when each one is expected to
// start:
//   - if a match has its own `scheduledTime`, that's used as a fixed anchor
//   - otherwise, it's estimated to start right after the previous match's
//     estimated end (+ a changeover buffer), cascading forward
//
// This means setting a start time on match #1 pushes every match after it
// (that doesn't have its own explicit time) to shift automatically.

const DEFAULT_MATCH_SECONDS = 180
const CHANGEOVER_SECONDS = 5 * 60 // gap for corner/ref reset between matches

export interface ScheduleMatch {
  id: string
  tatamiId?: string | null
  scheduledTime?: string | null
  timerSeconds?: number | null
  status?: string | null
  createdAt?: string | null
  bracketSlot?: number | null

  // Display fields (optional — queue API se aate hain)
  redAthlete?: {
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    country?: string | null
  } | null
  blueAthlete?: {
    fullName?: string | null
    firstName?: string | null
    lastName?: string | null
    country?: string | null
  } | null
}

// TatamiMatch (composables/useTatami.ts) is structurally compatible with
// ScheduleMatch once scheduledTime/timerSeconds are added to it — see the
// note in that file. No import needed here to avoid a circular dependency;
// computeTatamiSchedule is generic over T extends ScheduleMatch.

export interface ScheduledMatch<T extends ScheduleMatch = ScheduleMatch> {
  match: T
  estimatedStart: Date
  estimatedEnd: Date
  /** true if the start time came from the match's own scheduledTime, not a cascade estimate */
  isFixedTime: boolean
}

/**
 * Orders matches for a single tatami and computes an estimated start/end
 * for each. Pass only matches belonging to one tatami — mixing tatamis will
 * produce a meaningless single chain.
 */
export function computeTatamiSchedule<T extends ScheduleMatch>(
  matches: T[],
  changeoverSeconds = CHANGEOVER_SECONDS,
): ScheduledMatch<T>[] {
  // Ordering priority: explicit bracketSlot, then scheduledTime, then
  // creation order as a fallback so newly added matches land at the end.
  const sorted = [...matches].sort((a, b) => {
    if (a.bracketSlot != null && b.bracketSlot != null) {
      return a.bracketSlot - b.bracketSlot
    }
    if (a.scheduledTime && b.scheduledTime) {
      return new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    }
    if (a.scheduledTime && !b.scheduledTime) return -1
    if (!a.scheduledTime && b.scheduledTime) return 1
    return (a.createdAt || '').localeCompare(b.createdAt || '')
  })

  const result: ScheduledMatch<T>[] = []
  let cursor: Date | null = null

  for (const match of sorted) {
    const durationMs = (match.timerSeconds ?? DEFAULT_MATCH_SECONDS) * 1000
    let start: Date
    let isFixedTime = false

    if (match.scheduledTime) {
      start = new Date(match.scheduledTime)
      isFixedTime = true
    } else if (cursor) {
      start = new Date(cursor.getTime() + changeoverSeconds * 1000)
    } else {
      // No anchor yet on this tatami at all — nothing to estimate from,
      // so just surface "now" as a placeholder until an anchor is set.
      start = new Date()
    }

    const end = new Date(start.getTime() + durationMs)
    result.push({ match, estimatedStart: start, estimatedEnd: end, isFixedTime })
    cursor = end
  }

  return result
}

export function formatMatchTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function formatMatchTimeRange(start: Date, end: Date): string {
  return `${formatMatchTime(start)} – ${formatMatchTime(end)}`
}