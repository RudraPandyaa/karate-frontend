// ============================================================
// Shared frontend types
// Keep these aligned with the NestJS / Prisma API.
// ============================================================

// -------------------------
// Auth / Roles
// -------------------------

export type Role =
  | 'ATHLETE'
  | 'ADMIN'
  | 'ORGANIZER'
  | 'REFEREE'
  | 'SCOREKEEPER'
  | 'SUPER_ADMIN'

export interface AuthAthlete {
  id: string

  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  fullName?: string | null

  email?: string | null
  phone?: string | null

  country?: string | null
  countryCode?: string | null
  state?: string | null
  city?: string | null

  photoUrl?: string | null
  currentRank?: string | null
  style?: KarateStyle | null
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  createdAt?: string
  athlete?: AuthAthlete | null
}

export interface LoginResponse {
  accessToken: string
  user: User
}

// -------------------------
// Athlete
// -------------------------

export interface Athlete {
  id: string

  userId?: string | null

  firstName?: string | null
  middleName?: string | null
  lastName?: string | null
  fullName?: string | null

  email?: string | null
  phone?: string | null

  state: string
  country: string
  countryCode?: string | null
  city?: string | null

  dateOfBirth?: string | null
  photoUrl?: string | null

  address?: string | null
  bloodGroup?: string | null
  disability?: string | null

  emergencyContact?: string | null
  emergencyPhone?: string | null
  guardianName?: string | null

  federationId?: string | null
  postalCode?: string | null

  gender?: Gender | null
  style?: KarateStyle | null
  currentRank?: KarateRank | null

  coachId?: string | null
  dojoId?: string | null

  championshipHistory?: string | null

  createdAt?: string
  updatedAt?: string
}

export function athleteDisplayName(
  athlete: Athlete | null | undefined,
): string {
  if (!athlete) return 'TBD'

  return (
    athlete.fullName ||
    [athlete.firstName, athlete.middleName, athlete.lastName]
      .filter(Boolean)
      .join(' ') ||
    'TBD'
  )
}

// -------------------------
// Enums
// -------------------------

export type TournamentStatus =
  | 'DRAFT'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED'

export type TournamentDisplayStatus =
  | 'UPCOMING'
  | 'ONGOING'
  | 'DRAFT'
  | 'COMPLETED'
  | 'CANCELLED'

export type Discipline =
  | 'KATA'
  | 'KUMITE'
  | 'TEAM_KATA'
  | 'TEAM_KUMITE'

export type Gender =
  | 'MALE'
  | 'FEMALE'
  | 'MIXED'

export type KarateStyle = string
export type KarateRank = string

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
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINAL'
  | 'QUARTERFINAL'
  | 'SEMI_FINAL'
  | 'SEMIFINAL'
  | 'FINAL'
  | 'FINAL_MATCH'
  | 'REPECHAGE'
  | 'BRONZE'
  | 'BRONZE_MEDAL'

export type SenshuHolder =
  | 'NONE'
  | 'RED'
  | 'BLUE'

export type MatchResultType =
  | 'POINT_GAP'
  | 'TIME'
  | 'HANSOKU'
  | 'KIKEN'
  | 'HANTEI'
  | 'SENSHU'

export type Corner =
  | 'RED'
  | 'BLUE'

// -------------------------
// Tournament
// -------------------------

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

  athletesCount: number
}

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

export interface CreateTournamentPayload {
  name: string
  location: string
  startDate: string
  endDate: string
  organizationId: string
}

// -------------------------
// Category
// -------------------------

export interface Category {
  id: string
  name: string
  ageGroup: string
  gender: Gender
  discipline: Discipline
}

// -------------------------
// Tatami
// -------------------------

export interface Tatami {
  id: string
  number: number
  name?: string | null
}

// -------------------------
// Users attached to matches
// -------------------------

export interface SafeUser {
  id: string
  name: string
  email: string
  role?: Role
}

// -------------------------
// Match
// -------------------------

export interface MatchAthlete extends Athlete {}

export interface Match {
  id: string

  categoryId: string

  category: Pick<
    Category,
    'id' | 'name' | 'ageGroup' | 'gender' | 'discipline'
  >

  tatamiId: string | null
  tatami: Tatami | null

  round: MatchRound
  bracketSlot: number | null

  redAthleteId: string | null
  redAthlete: MatchAthlete | null

  blueAthleteId: string | null
  blueAthlete: MatchAthlete | null

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

  nextCorner?: Corner
  loserNextMatchId?: string
  loserNextCorner?: Corner
}

// -------------------------
// Live matches
// -------------------------

export interface LiveMatchSummary {
  id: string

  tatami: Tatami

  category: Pick<Category, 'name'>

  round: string

  redAthlete: MatchAthlete | null
  blueAthlete: MatchAthlete | null

  redScore: number
  blueScore: number

  timeRemaining: number
  status: MatchStatus

  discipline: Discipline

  redKataScore?: number
  blueKataScore?: number
}

// -------------------------
// Dashboard
// -------------------------

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