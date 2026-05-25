export type TeamName = "BLACK" | "WHITE" | "RED"
export type GameDayMode = "TWO_WAY" | "THREE_WAY"
export type GameDayType = "REGULAR" | "EXCHANGE"
export type GameDayStatus = "SCHEDULED" | "COMPLETED" | "HOLIDAY" | "CLOSED"
export type AttendanceStatus = "ATTENDING" | "ABSENT" | "UNDECIDED"
export type ResultOutcome = "TEAM1_WIN" | "TEAM2_WIN" | "DRAW"
export type MemberStatus = "REGULAR" | "GUEST" | "RESTING" | "WITHDRAWN"
export type MemberRole = "NONE" | "PRESIDENT" | "TREASURER"
export type PaymentStatus = "PAID" | "UNPAID"
export type StatisticsScope = "RECENT" | "ALL" | "MONTH"

export interface StatisticsFilter {
  scope: StatisticsScope
  year?: number
  month?: number
}

export interface Member {
  id: number
  name: string
  birthYear: number | null
  height: number | null
  position: string | null
  region: string | null
  role: MemberRole
  status: MemberStatus
  restUntilDate: string | null
  memo: string | null
  profileImageUrl: string | null
  kakaoLinked: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  kakaoId: string
  nickname: string
  memberId: number | null
  memberName: string | null
  linked: boolean
}

export interface MemberRequest {
  name: string
  birthYear: number | null
  height: number | null
  position: string
  region: string
  role: MemberRole
  status: MemberStatus
  restUntilDate: string | null
  memo: string
}

export interface GameDay {
  id: number
  gameDate: string
  place: string
  startTime: string
  endTime: string
  mode: GameDayMode
  gameType: GameDayType
  status: GameDayStatus
  teamCount: number
  memo: string | null
}

export interface GameDayRequest {
  gameDate: string
  place: string
  startTime: string
  endTime: string
  mode: GameDayMode
  gameType: GameDayType
  status: GameDayStatus
  memo: string
}

export interface AttendanceSummary {
  gameDayId: number
  attendingCount: number
  absentCount: number
  undecidedCount: number
  totalCount: number
}

export interface AttendanceVote {
  id: number
  gameDayId: number
  memberId: number | null
  voterName: string
  status: AttendanceStatus
  memo: string | null
}

export interface AttendanceVoteRequest {
  gameDayId: number
  memberId: number | null
  voterName: string
  status: AttendanceStatus
  memo: string
}

export interface TeamMember {
  id: number
  memberId: number | null
  playerName: string
  sortOrder: number
}

export interface Team {
  id: number
  gameDayId: number
  name: TeamName
  captainMemberId: number | null
  captainName: string | null
  memo: string | null
  members: TeamMember[]
}

export interface TeamMemberRequest {
  memberId: number | null
  playerName: string
}

export interface TeamRequest {
  gameDayId: number
  name: TeamName
  captainMemberId: number | null
  memo: string
  members: TeamMemberRequest[]
}

export interface GameResult {
  id: number
  gameDayId: number
  gameDate: string
  matchNo: number
  quarterNo: number
  team1Name: TeamName
  team2Name: TeamName
  team1Score: number
  team2Score: number
  outcome: ResultOutcome
}

export interface GameResultRequest {
  gameDayId: number
  matchNo: number
  quarterNo: number
  team1Name: TeamName
  team2Name: TeamName
  team1Score: number
  team2Score: number
  memo: string
}

export interface Notice {
  id: number
  title: string
  content: string
  authorName: string
  pinned: boolean
  createdAt: string
}

export interface NoticeRequest {
  title: string
  content: string
  authorName: string
  pinned: boolean
}

export interface NoticeComment {
  id: number
  noticeId: number
  authorName: string
  content: string
  createdAt: string
}

export interface NoticeCommentRequest {
  authorName: string
  content: string
}

export interface FeeMonth {
  id: number
  year: number
  month: number
  roundCount: number
  regularFeeAmount: number
  guestFeeAmount: number
  memo: string | null
}

export interface FeeMonthRequest {
  year: number
  month: number
  roundCount: number
  regularFeeAmount: number
  guestFeeAmount: number
  memo: string
}

export interface FeePayment {
  id: number
  feeMonthId: number
  memberId: number | null
  payerName: string
  amount: number
  status: PaymentStatus
  paidDate: string | null
  memo: string | null
}

export interface FeePaymentRequest {
  feeMonthId: number
  memberId: number | null
  payerName: string
  amount: number
  status: PaymentStatus
  paidDate: string | null
  memo: string
}

export interface FeeExpense {
  id: number
  feeMonthId: number
  title: string
  amount: number
  expenseDate: string
  memo: string | null
}

export interface FeeExpenseRequest {
  feeMonthId: number
  title: string
  amount: number
  expenseDate: string
  memo: string
}

export interface FeeSummary {
  feeMonthId: number
  totalIncome: number
  totalExpense: number
  balance: number
  paidCount: number
  unpaidCount: number
}

export interface RecentResult {
  gameResultId: number
  gameDayId: number
  gameDate: string
  matchNo: number
  quarterNo: number
  teamName: TeamName
  opponentTeamName: TeamName
  pointsFor: number
  pointsAgainst: number
  outcome: ResultOutcome
}

export interface MemberStatistics {
  memberId: number
  memberName: string
  playedCount: number
  winCount: number
  lossCount: number
  drawCount: number
  winRate: number
  averagePointsFor: number
  averagePointsAgainst: number
  recentResults: RecentResult[]
}

export interface MemberSynergy {
  memberId: number
  memberName: string
  playedCount: number
  winCount: number
  lossCount: number
  drawCount: number
  winRate: number
  averagePointsFor: number
  averagePointsAgainst: number
  recentResults: RecentResult[]
}

export interface CombinationStatistics {
  memberIds: number[]
  memberNames: string[]
  playedCount: number
  winCount: number
  lossCount: number
  drawCount: number
  winRate: number
  averagePointsFor: number
  averagePointsAgainst: number
}

export interface StatisticsOverview {
  bestDuo: CombinationStatistics | null
  bestScoringDuo: CombinationStatistics | null
  bestDefenseDuo: CombinationStatistics | null
  mostPlayedDuo: CombinationStatistics | null
}

export interface Dashboard {
  nextGameDay: GameDay | null
  nextGameAttendance: AttendanceSummary | null
  recentResults: GameResult[]
  notices: Notice[]
}
