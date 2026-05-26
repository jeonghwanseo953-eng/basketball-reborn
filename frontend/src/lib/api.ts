import type {
  AttendanceSummary,
  AttendanceVote,
  AttendanceVoteRequest,
  AuthResponse,
  CombinationStatistics,
  Dashboard,
  FeeExpense,
  FeeExpenseRequest,
  FeeMonth,
  FeeMonthRequest,
  FeePayment,
  FeePaymentRequest,
  FeeSummary,
  GameDay,
  GameDayRequest,
  GameResult,
  GameResultRequest,
  Member,
  MemberRequest,
  MemberStatistics,
  MemberSynergy,
  Notice,
  NoticeComment,
  NoticeCommentRequest,
  NoticeRequest,
  Team,
  TeamRequest,
  StatisticsFilter,
  StatisticsOverview,
} from "@/types/api"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""
const authStorageKey = "reborn-auth-session"

function authToken() {
  try {
    const session = JSON.parse(localStorage.getItem(authStorageKey) ?? "null") as { token?: string } | null
    return session?.token ?? ""
  } catch {
    return ""
  }
}

async function getErrorMessage(response: Response): Promise<string> {
  const fallback = `Request failed: ${response.status}`
  const contentType = response.headers.get("content-type") ?? ""

  try {
    if (contentType.includes("application/json")) {
      const body = (await response.json()) as Record<string, unknown>
      const message = body.detail ?? body.message ?? body.error
      return typeof message === "string" && message.trim() ? message : fallback
    }

    const body = await response.text()
    return body.trim() || fallback
  } catch {
    return fallback
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, withAuth(options))

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }

  return response.json()
}

async function requestEmpty(path: string, options?: RequestInit): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, withAuth(options))

  if (!response.ok) {
    throw new Error(await getErrorMessage(response))
  }
}

function withAuth(options?: RequestInit): RequestInit | undefined {
  const token = authToken()
  if (!token) {
    return options
  }

  return {
    ...options,
    headers: {
      ...(options?.headers ?? {}),
      "X-Reborn-Auth-Token": token,
    },
  }
}

export function getKakaoLoginUrl(redirectUri: string, state: string): Promise<{ url: string }> {
  const params = new URLSearchParams({ redirectUri, state })
  return request<{ url: string }>(`/api/auth/kakao/login-url?${params.toString()}`)
}

export function completeKakaoLogin(code: string, redirectUri: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/kakao/callback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, redirectUri }),
  })
}

export function devLogin(): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/dev-login", {
    method: "POST",
  })
}

export function linkAuthMember(memberId: number): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/link-member", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memberId }),
  })
}

export function getLinkableMembers(): Promise<Member[]> {
  return request<Member[]>("/api/auth/linkable-members")
}

export function getDashboard(): Promise<Dashboard> {
  return request<Dashboard>("/api/dashboard")
}

export function getMembers(): Promise<Member[]> {
  return request<Member[]>("/api/members")
}

export function createMember(payload: MemberRequest): Promise<Member> {
  return request<Member>("/api/members", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function updateMember(id: number, payload: MemberRequest): Promise<Member> {
  return request<Member>(`/api/members/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function updateMemberProfileImage(id: number, profileImageUrl: string): Promise<Member> {
  return request<Member>(`/api/members/${id}/profile-image`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ profileImageUrl }),
  })
}

export function deleteMember(id: number): Promise<void> {
  return requestEmpty(`/api/members/${id}`, {
    method: "DELETE",
  })
}

export function getGameDays(): Promise<GameDay[]> {
  return request<GameDay[]>("/api/game-days")
}

export function createGameDay(payload: GameDayRequest): Promise<GameDay> {
  return request<GameDay>("/api/game-days", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function updateGameDay(id: number, payload: GameDayRequest): Promise<GameDay> {
  return request<GameDay>(`/api/game-days/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function deleteGameDay(id: number): Promise<void> {
  return requestEmpty(`/api/game-days/${id}`, {
    method: "DELETE",
  })
}

export function getAttendanceVotes(gameDayId: number): Promise<AttendanceVote[]> {
  return request<AttendanceVote[]>(`/api/attendance-votes?gameDayId=${gameDayId}`)
}

export function getAttendanceSummary(gameDayId: number): Promise<AttendanceSummary> {
  return request<AttendanceSummary>(`/api/attendance-votes/summary?gameDayId=${gameDayId}`)
}

export function createAttendanceVote(payload: AttendanceVoteRequest): Promise<AttendanceVote> {
  return request<AttendanceVote>("/api/attendance-votes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function updateAttendanceVote(id: number, payload: AttendanceVoteRequest): Promise<AttendanceVote> {
  return request<AttendanceVote>(`/api/attendance-votes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function deleteAttendanceVote(id: number): Promise<void> {
  return requestEmpty(`/api/attendance-votes/${id}`, {
    method: "DELETE",
  })
}

export function getTeams(gameDayId: number): Promise<Team[]> {
  return request<Team[]>(`/api/teams?gameDayId=${gameDayId}`)
}

export function createTeam(payload: TeamRequest): Promise<Team> {
  return request<Team>("/api/teams", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function updateTeam(id: number, payload: TeamRequest): Promise<Team> {
  return request<Team>(`/api/teams/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function deleteTeam(id: number): Promise<void> {
  return requestEmpty(`/api/teams/${id}`, {
    method: "DELETE",
  })
}

export function getGameResults(gameDayId: number): Promise<GameResult[]> {
  return request<GameResult[]>(`/api/game-results?gameDayId=${gameDayId}`)
}

export function createGameResult(payload: GameResultRequest): Promise<GameResult> {
  return request<GameResult>("/api/game-results", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function updateGameResult(id: number, payload: GameResultRequest): Promise<GameResult> {
  return request<GameResult>(`/api/game-results/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function deleteGameResult(id: number): Promise<void> {
  return requestEmpty(`/api/game-results/${id}`, {
    method: "DELETE",
  })
}

export function getNotices(): Promise<Notice[]> {
  return request<Notice[]>("/api/notices")
}

export function createNotice(payload: NoticeRequest): Promise<Notice> {
  return request<Notice>("/api/notices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function updateNotice(id: number, payload: NoticeRequest): Promise<Notice> {
  return request<Notice>(`/api/notices/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function deleteNotice(id: number): Promise<void> {
  return requestEmpty(`/api/notices/${id}`, {
    method: "DELETE",
  })
}

export function getNoticeComments(noticeId: number): Promise<NoticeComment[]> {
  return request<NoticeComment[]>(`/api/notices/${noticeId}/comments`)
}

export function createNoticeComment(noticeId: number, payload: NoticeCommentRequest): Promise<NoticeComment> {
  return request<NoticeComment>(`/api/notices/${noticeId}/comments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function updateNoticeComment(noticeId: number, commentId: number, payload: NoticeCommentRequest): Promise<NoticeComment> {
  return request<NoticeComment>(`/api/notices/${noticeId}/comments/${commentId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
}

export function deleteNoticeComment(noticeId: number, commentId: number): Promise<void> {
  return requestEmpty(`/api/notices/${noticeId}/comments/${commentId}`, {
    method: "DELETE",
  })
}

export function getFeeMonths(): Promise<FeeMonth[]> {
  return request<FeeMonth[]>("/api/fee-months")
}

export function createFeeMonth(payload: FeeMonthRequest): Promise<FeeMonth> {
  return request<FeeMonth>("/api/fee-months", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function updateFeeMonth(id: number, payload: FeeMonthRequest): Promise<FeeMonth> {
  return request<FeeMonth>(`/api/fee-months/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function deleteFeeMonth(id: number): Promise<void> {
  return requestEmpty(`/api/fee-months/${id}`, {
    method: "DELETE",
  })
}

export function getFeePayments(feeMonthId: number): Promise<FeePayment[]> {
  return request<FeePayment[]>(`/api/fee-payments?feeMonthId=${feeMonthId}`)
}

export function createFeePayment(payload: FeePaymentRequest): Promise<FeePayment> {
  return request<FeePayment>("/api/fee-payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function updateFeePayment(id: number, payload: FeePaymentRequest): Promise<FeePayment> {
  return request<FeePayment>(`/api/fee-payments/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function deleteFeePayment(id: number): Promise<void> {
  return requestEmpty(`/api/fee-payments/${id}`, {
    method: "DELETE",
  })
}

export function getFeeExpenses(feeMonthId: number): Promise<FeeExpense[]> {
  return request<FeeExpense[]>(`/api/fee-expenses?feeMonthId=${feeMonthId}`)
}

export function createFeeExpense(payload: FeeExpenseRequest): Promise<FeeExpense> {
  return request<FeeExpense>("/api/fee-expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function updateFeeExpense(id: number, payload: FeeExpenseRequest): Promise<FeeExpense> {
  return request<FeeExpense>(`/api/fee-expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
}

export function deleteFeeExpense(id: number): Promise<void> {
  return requestEmpty(`/api/fee-expenses/${id}`, {
    method: "DELETE",
  })
}

export function getFeeSummary(feeMonthId: number): Promise<FeeSummary> {
  return request<FeeSummary>(`/api/fee-months/${feeMonthId}/summary`)
}

export function getMemberStatistics(filter?: StatisticsFilter): Promise<MemberStatistics[]> {
  return request<MemberStatistics[]>(`/api/statistics/members${statisticsQuery(filter)}`)
}

export function getMemberStatistic(memberId: number, filter?: StatisticsFilter): Promise<MemberStatistics> {
  return request<MemberStatistics>(`/api/statistics/members/${memberId}${statisticsQuery(filter)}`)
}

export function getMemberSynergies(memberId: number, filter?: StatisticsFilter): Promise<MemberSynergy[]> {
  return request<MemberSynergy[]>(`/api/statistics/members/${memberId}/synergies${statisticsQuery(filter)}`)
}

export function getStatisticsOverview(filter?: StatisticsFilter): Promise<StatisticsOverview> {
  return request<StatisticsOverview>(`/api/statistics/overview${statisticsQuery(filter)}`)
}

export function getCombinationStatistics(memberIds: number[], filter?: StatisticsFilter): Promise<CombinationStatistics> {
  const params = statisticsParams(filter)
  params.set("memberIds", memberIds.join(","))

  return request<CombinationStatistics>(`/api/statistics/combinations?${params.toString()}`)
}

function statisticsQuery(filter?: StatisticsFilter) {
  const params = statisticsParams(filter)
  const query = params.toString()

  return query ? `?${query}` : ""
}

function statisticsParams(filter?: StatisticsFilter) {
  const params = new URLSearchParams()

  if (filter?.scope) {
    params.set("scope", filter.scope)
  }

  if (filter?.scope === "MONTH" && filter.year && filter.month) {
    params.set("year", String(filter.year))
    params.set("month", String(filter.month))
  }

  return params
}
