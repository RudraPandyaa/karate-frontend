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

export type Corner = 'RED' | 'BLUE'

export interface Athlete {
  id: string
  name: string
  state: string
  country: string
}

export interface Tournament {
  id: string
  name: string
  location: string
  startDate: string
  endDate: string
  status: TournamentStatus
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

// Raw shape of GET /tournaments/:id/categories — used only to sum athlete
// counts per tournament (no dedicated endpoint for this exists yet).
export interface RawCategoryWithCounts {
  id: string
  _count: {
    athletes: number
    matches: number
  }
}

// Display-only status, derived client-side since the schema's TournamentStatus
// enum (DRAFT/ONGOING/COMPLETED/CANCELLED) has no "Upcoming" value but the
// UI needs one. DRAFT + future startDate => Upcoming. Adjust the mapping in
// deriveDisplayStatus() in useTournamentsData.ts if this assumption is wrong.
export type TournamentDisplayStatus = 'UPCOMING' | 'LIVE' | 'DRAFT' | 'COMPLETED' | 'CANCELLED'

export interface TournamentRow {
  id: string
  name: string
  subtitle: string // no dedicated field in schema for this — falls back to location
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