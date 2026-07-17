// These mirror the enums/models in schema.prisma so the frontend and
// backend agree on shape. Keep in sync if the schema changes.

export type Role =
  | 'ADMIN'
  | 'ORGANIZER'
  | 'REFEREE'
  | 'SCOREKEEPER'
  | 'SUPER_ADMIN'
  | 'OPERATOR'

export type TournamentStatus = 'DRAFT' | 'ONGOING' | 'COMPLETED' | 'CANCELLED'

export type Discipline = 'KATA' | 'KUMITE' | 'TEAM_KATA' | 'TEAM_KUMITE'

export type Gender = 'MALE' | 'FEMALE' | 'MIXED'

export type MatchStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'

export type MatchRound =
  | 'ROUND_1'
  | 'ROUND_2'
  | 'ROUND_3'
  | 'QUARTER_FINAL'
  | 'QUARTERFINAL'
  | 'SEMI_FINAL'
  | 'SEMIFINAL'
  | 'FINAL'
  | 'FINAL_MATCH'
  | 'REPECHAGE'
  | 'BRONZE'

export type SenshuHolder = 'NONE' | 'RED' | 'BLUE'

export type MatchResultType =
  | 'POINT_GAP'
  | 'TIME'
  | 'HANSOKU'
  | 'KIKEN'
  | 'HANTEI'
  | 'SENSHU'

export type Corner = 'RED' | 'BLUE'

export interface Athlete {
  id: string
  name: string
  state: string
  country: string
  dateOfBirth?: string | null
}

export interface Tournament {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  status: TournamentStatus
  displayStatus: TournamentDisplayStatus
  categoriesCount: number
  matchesCount: number
}

export interface Category {
  id: string
  name: string
  ageGroup: string
  gender: Gender
  discipline: Discipline
}

export interface Tatami {
  id: string
  number: number
  name?: string | null
}

export interface SafeUser {
  id: string
  name: string
  email: string
  role?: Role
}

export interface Match {
  id: string
  categoryId: string
  category: Pick<Category, 'id' | 'name' | 'ageGroup' | 'gender' | 'discipline'>
  tatamiId: string | null
  tatami: Tatami | null
  round: MatchRound
  bracketSlot: number | null
  redAthleteId: string | null
  redAthlete: Athlete | null
  blueAthleteId: string | null
  blueAthlete: Athlete | null
  refereeId: string | null
  referee: SafeUser | null
  scorekeeperId: string | null
  scorekeeper: SafeUser | null
  status: MatchStatus
  redScore: number
  blueScore: number
  senshu: SenshuHolder
  senshuLocked: boolean
  timerSeconds: number
  timeRemaining: number
  winnerId: string | null
  resultType: MatchResultType | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

// Shape returned by GET /tournaments/:id/dashboard (or assembled client-side
// from /matches?status=IN_PROGRESS). Adjust field names once the real
// endpoint contract is shared.
export interface LiveMatchSummary {
  id: string
  tatami: Tatami
  category: Pick<Category, 'name'>
  round: string
  redAthlete: Athlete | null
  blueAthlete: Athlete | null
  redScore: number
  blueScore: number
  timeRemaining: number // seconds
  status: MatchStatus
  discipline: Discipline
  // Kata-specific (discipline === 'KATA' / 'TEAM_KATA')
  redKataScore?: number
  blueKataScore?: number
}

export interface UpcomingMatchRow {
  id: string
  matchNo: string
  categoryName: string
  round: string
  tatamiNumber: number
  redAthlete: Athlete
  blueAthlete: Athlete
}

export interface DashboardStats {
  totalTournaments: number
  totalTournamentsDeltaPct?: number
  activeTournamentsCount: number
  activeTournamentName: string | null
  totalAthletes: number
  runningMatches: number
}

// ===== TOURNAMENTS PAGE =====

// Raw shape of GET /tournaments — confirmed against tournaments.service.ts.
// _count comes from Prisma's `include: { _count: { select: { categories, tatamis } } }`.
export interface RawTournamentListItem {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  status: TournamentStatus
  createdAt: string
  updatedAt: string
  _count: {
    categories: number
    tatamis: number
  }
}

// Display-only status, derived client-side since the schema's TournamentStatus
// enum (DRAFT/ONGOING/COMPLETED/CANCELLED) has no "Upcoming" value but the
// UI needs one. DRAFT + future startDate => Upcoming. Mapping lives in
// utils/tournamentStatus.ts (deriveDisplayStatus) — shared by the list page
// and the detail page, so update it there, not per-component.
export type TournamentDisplayStatus = 'UPCOMING' | 'LIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED'

export interface TournamentRow {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  status: TournamentStatus
  displayStatus: TournamentDisplayStatus
  categoriesCount: number
  athletesCount: number
}

export interface TournamentsPageStats {
  totalEvents: number
  activeNow: number
  registeredAthletes: number
}

// Body for POST /tournaments — organizationId is a plain text field for now
// (no organizations.controller.ts shared yet to build a real picker).
export interface CreateTournamentPayload {
  name: string
  location: string
  startDate: string
  endDate: string
  organizationId: string
}