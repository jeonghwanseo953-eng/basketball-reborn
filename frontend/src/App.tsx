import { FormEvent, useEffect, useState } from "react"
import { AlertTriangle, BarChart3, ClipboardList, LayoutDashboard, Loader2, LogOut, MessageSquareText, Trophy, UsersRound } from "lucide-react"
import {
  createAttendanceVote,
  createFeeExpense,
  createFeeMonth,
  createFeePayment,
  createGameDay,
  createGameResult,
  createMember,
  createNotice,
  createTeam,
  deleteAttendanceVote,
  deleteFeeExpense,
  deleteFeeMonth,
  deleteFeePayment,
  deleteMember,
  deleteNotice,
  deleteTeam,
  completeKakaoLogin,
  devLogin,
  getAttendanceSummary,
  getAttendanceVotes,
  getDashboard,
  getFeeExpenses,
  getFeeMonths,
  getFeePayments,
  getFeeSummary,
  getGameDays,
  getGameResults,
  getCombinationStatistics,
  getMemberStatistic,
  getMemberStatistics,
  getMembers,
  getNotices,
  getStatisticsOverview,
  getTeams,
  getKakaoLoginUrl,
  getLinkableMembers,
  linkAuthMember,
  updateAttendanceVote,
  updateFeeExpense,
  updateFeeMonth,
  updateFeePayment,
  updateGameDay,
  updateGameResult,
  updateMember,
  updateMemberProfileImage,
  updateNotice,
  updateTeam,
} from "@/lib/api"
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
  MemberRole,
  MemberStatistics,
  Notice,
  NoticeRequest,
  StatisticsFilter,
  StatisticsOverview,
  Team,
  TeamRequest,
  TeamName,
} from "@/types/api"
import { FormModal, TabButton } from "@/components/common"
import { AttendanceView } from "@/components/views/attendance-view"
import { DashboardView } from "@/components/views/dashboard-view"
import { FeesView } from "@/components/views/fees-view"
import { GamesView } from "@/components/views/games-view"
import { MembersView } from "@/components/views/members-view"
import { NoticesView } from "@/components/views/notices-view"
import { ResultsView } from "@/components/views/results-view"
import { StatsView } from "@/components/views/stats-view"
import { TeamsView } from "@/components/views/teams-view"
import {
  emptyAttendanceForm,
  emptyFeeExpenseForm,
  emptyFeeMonthForm,
  emptyFeePaymentForm,
  emptyGameForm,
  emptyMemberForm,
  emptyNoticeForm,
  emptyResultForm,
} from "@/lib/defaults"

type View = "dashboard" | "members" | "games" | "attendance" | "notices" | "fees" | "stats"
type GameOperationView = "teams" | "results"
type AuthMode = "member" | "guest"
type AppHistoryState = {
  rebornApp: true
  view: View
  gameOperationModal: GameOperationView | null
  selectedGameDayId: number
}
type AuthSession = {
  mode: AuthMode
  name: string
  token?: string
  memberId?: number | null
  memberName?: string | null
  memberRole?: MemberRole | null
  linked?: boolean
}
const defaultStatisticsFilter: StatisticsFilter = { scope: "RECENT" }
const authStorageKey = "reborn-auth-session"
type TeamValidationIssue = {
  tone: "warning" | "danger"
  message: string
}
type TeamValidationConfirm = {
  action: "close"
  title: string
  description: string
  confirmLabel: string
  issues: TeamValidationIssue[]
}


function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() => readAuthSession())
  const [view, setView] = useState<View>("dashboard")
  const [gameOperationModal, setGameOperationModal] = useState<GameOperationView | null>(null)
  const [teamValidationConfirm, setTeamValidationConfirm] = useState<TeamValidationConfirm | null>(null)
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [linkableMembers, setLinkableMembers] = useState<Member[]>([])
  const [gameDays, setGameDays] = useState<GameDay[]>([])
  const [attendanceVotes, setAttendanceVotes] = useState<AttendanceVote[]>([])
  const [dashboardAttendanceVotes, setDashboardAttendanceVotes] = useState<AttendanceVote[]>([])
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [gameResults, setGameResults] = useState<GameResult[]>([])
  const [notices, setNotices] = useState<Notice[]>([])
  const [feeMonths, setFeeMonths] = useState<FeeMonth[]>([])
  const [feePayments, setFeePayments] = useState<FeePayment[]>([])
  const [feeExpenses, setFeeExpenses] = useState<FeeExpense[]>([])
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null)
  const [memberStats, setMemberStats] = useState<MemberStatistics[]>([])
  const [selectedMemberStat, setSelectedMemberStat] = useState<MemberStatistics | null>(null)
  const [combinationStat, setCombinationStat] = useState<CombinationStatistics | null>(null)
  const [statisticsOverview, setStatisticsOverview] = useState<StatisticsOverview | null>(null)
  const [memberForm, setMemberForm] = useState<MemberRequest>(emptyMemberForm)
  const [gameForm, setGameForm] = useState<GameDayRequest>(emptyGameForm)
  const [attendanceForm, setAttendanceForm] = useState<AttendanceVoteRequest>(emptyAttendanceForm)
  const [resultForm, setResultForm] = useState<GameResultRequest>(emptyResultForm)
  const [noticeForm, setNoticeForm] = useState<NoticeRequest>(emptyNoticeForm)
  const [feeMonthForm, setFeeMonthForm] = useState<FeeMonthRequest>(emptyFeeMonthForm)
  const [feePaymentForm, setFeePaymentForm] = useState<FeePaymentRequest>(emptyFeePaymentForm)
  const [feeExpenseForm, setFeeExpenseForm] = useState<FeeExpenseRequest>(emptyFeeExpenseForm)
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
  const [editingAttendanceVoteId, setEditingAttendanceVoteId] = useState<number | null>(null)
  const [editingGameDayId, setEditingGameDayId] = useState<number | null>(null)
  const [editingNoticeId, setEditingNoticeId] = useState<number | null>(null)
  const [editingResultId, setEditingResultId] = useState<number | null>(null)
  const [editingFeeMonthId, setEditingFeeMonthId] = useState<number | null>(null)
  const [editingFeePaymentId, setEditingFeePaymentId] = useState<number | null>(null)
  const [editingFeeExpenseId, setEditingFeeExpenseId] = useState<number | null>(null)
  const [selectedGameDayId, setSelectedGameDayId] = useState<number>(0)
  const [selectedFeeMonthId, setSelectedFeeMonthId] = useState<number>(0)
  const [selectedStatMemberId, setSelectedStatMemberId] = useState<number>(0)
  const [combinationMemberIds, setCombinationMemberIds] = useState<number[]>([])
  const [statisticsFilter, setStatisticsFilter] = useState<StatisticsFilter>(defaultStatisticsFilter)
  const [loading, setLoading] = useState(true)
  const [savingMember, setSavingMember] = useState(false)
  const [savingGame, setSavingGame] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [savingTeam, setSavingTeam] = useState(false)
  const [savingResult, setSavingResult] = useState(false)
  const [savingNotice, setSavingNotice] = useState(false)
  const [savingFee, setSavingFee] = useState(false)
  const [kakaoLoginLoading, setKakaoLoginLoading] = useState(() => new URLSearchParams(window.location.search).has("code"))
  const [error, setError] = useState<string | null>(null)
  const readOnly = authSession?.mode === "guest"
  const currentMemberRole = authSession?.memberRole ?? "NONE"
  const canManageEverything = currentMemberRole === "WEB_ADMIN" || currentMemberRole === "PRESIDENT"
  const busyMessage = getBusyMessage({
    loading,
    savingMember,
    savingGame,
    savingAttendance,
    savingTeam,
    savingResult,
    savingNotice,
    savingFee,
  })

  function enterAsGuest() {
    const session = { mode: "guest" as const, name: "비회원" }
    setAuthSession(session)
    localStorage.setItem(authStorageKey, JSON.stringify(session))
  }

  function saveAuthSession(session: AuthSession) {
    setAuthSession(session)
    localStorage.setItem(authStorageKey, JSON.stringify(session))
  }

  function authResponseToSession(response: AuthResponse): AuthSession {
    return {
      mode: "member",
      name: response.memberName ?? response.nickname ?? "카카오 사용자",
      token: response.token,
      memberId: response.memberId,
      memberName: response.memberName,
      memberRole: response.memberRole,
      linked: response.linked,
    }
  }

  async function loginWithKakao() {
    const redirectUri = `${window.location.origin}${window.location.pathname}`
    const state = crypto.randomUUID()

    setKakaoLoginLoading(true)
    setError(null)
    try {
      sessionStorage.setItem("reborn-kakao-state", state)
      const { url } = await getKakaoLoginUrl(redirectUri, state)
      window.location.href = url
    } catch {
      const response = await devLogin()
      saveAuthSession(authResponseToSession(response))
      setKakaoLoginLoading(false)
    }
  }

  async function linkCurrentMember(memberId: number) {
    try {
      const response = await linkAuthMember(memberId)
      saveAuthSession(authResponseToSession(response))
      setMembers(await getMembers())
      setLinkableMembers([])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "회원 연동에 실패했습니다.")
      setLinkableMembers(await getLinkableMembers())
    }
  }

  async function createFirstMemberAndLink(payload: Pick<MemberRequest, "name" | "birthYear" | "height" | "position" | "region">) {
    try {
      setLoading(true)
      setError(null)
      const created = await createMember({
        ...payload,
        role: "PRESIDENT",
        status: "REGULAR",
        restUntilDate: null,
        memo: "최초 관리자",
      })
      await linkCurrentMember(created.id)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "최초 회원을 생성하지 못했습니다.")
      setLinkableMembers(await getLinkableMembers().catch(() => []))
    } finally {
      setLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem(authStorageKey)
    setAuthSession(null)
    setView("dashboard")
  }

  function makeHistoryState(
    nextView: View,
    nextGameOperationModal: GameOperationView | null = null,
    nextSelectedGameDayId = selectedGameDayId,
  ): AppHistoryState {
    return {
      rebornApp: true,
      view: nextView,
      gameOperationModal: nextGameOperationModal,
      selectedGameDayId: nextSelectedGameDayId,
    }
  }

  function replaceAppHistory(
    nextView: View,
    nextGameOperationModal: GameOperationView | null = null,
    nextSelectedGameDayId = selectedGameDayId,
  ) {
    window.history.replaceState(makeHistoryState(nextView, nextGameOperationModal, nextSelectedGameDayId), "", window.location.pathname)
  }

  function pushAppHistory(
    nextView: View,
    nextGameOperationModal: GameOperationView | null = null,
    nextSelectedGameDayId = selectedGameDayId,
  ) {
    const currentState = window.history.state as Partial<AppHistoryState> | null
    if (
      currentState?.rebornApp &&
      currentState.view === nextView &&
      currentState.gameOperationModal === nextGameOperationModal &&
      currentState.selectedGameDayId === nextSelectedGameDayId
    ) {
      return
    }

    window.history.pushState(makeHistoryState(nextView, nextGameOperationModal, nextSelectedGameDayId), "", window.location.pathname)
  }

  function navigateToView(nextView: View) {
    setGameOperationModal(null)
    setView(nextView)
    pushAppHistory(nextView, null)
  }

  function requireWriteAccess() {
    if (!readOnly) {
      return true
    }

    setError("비회원은 조회만 가능합니다. 카카오 로그인 후 이용해주세요.")
    return false
  }

  function canEditTeamsForGameDay(gameDayId: number) {
    if (readOnly || !gameDayId) {
      return false
    }

    if (canManageEverything) {
      return true
    }

    const selectedGameDay = gameDays.find((gameDay) => gameDay.id === gameDayId)
    return Boolean(authSession?.memberId && selectedGameDay?.teamBuilderMemberId === authSession.memberId)
  }

  function canEditSelectedGameDayTeams() {
    return canEditTeamsForGameDay(selectedGameDayId)
  }

  function requireTeamBuilderAccess() {
    if (canEditSelectedGameDayTeams()) {
      return true
    }

    setError("팀 구성 담당자만 팀 구성을 수정할 수 있습니다.")
    return false
  }

  async function loadAll() {
    setLoading(true)
    setError(null)

    try {
      const [dashboardData, memberData, gameDayData] = await Promise.all([
        getDashboard(),
        getMembers(),
        getGameDays(),
      ])
      setDashboard(dashboardData)
      setMembers(memberData)
      setGameDays(gameDayData)

      const defaultGameDayId = dashboardData.nextGameDay?.id ?? gameDayData[0]?.id ?? 0
      if (defaultGameDayId) {
        setSelectedGameDayId(defaultGameDayId)
        setAttendanceForm((current) => ({ ...current, gameDayId: defaultGameDayId }))
        const [votes, summary] = await Promise.all([
          getAttendanceVotes(defaultGameDayId),
          getAttendanceSummary(defaultGameDayId),
        ])
        setAttendanceVotes(votes)
        if (dashboardData.nextGameDay?.id === defaultGameDayId) {
          setDashboardAttendanceVotes(votes)
        } else if (dashboardData.nextGameDay?.id) {
          setDashboardAttendanceVotes(await getAttendanceVotes(dashboardData.nextGameDay.id))
        } else {
          setDashboardAttendanceVotes([])
        }
        setAttendanceSummary(summary)
        setResultForm((current) => ({ ...current, gameDayId: defaultGameDayId }))
      }

      setLoading(false)
      void loadDeferredHomeData({ dashboardData, memberData, defaultGameDayId })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "알 수 없는 오류가 발생했습니다.")
    } finally {
      setLoading(false)
    }
  }

  async function loadDeferredHomeData({
    dashboardData,
    memberData,
    defaultGameDayId,
  }: {
    dashboardData: Dashboard
    memberData: Member[]
    defaultGameDayId: number
  }) {
    try {
      const [noticeData, feeMonthData, statsData, overviewData] = await Promise.all([
        getNotices(),
        getFeeMonths(),
        getMemberStatistics(defaultStatisticsFilter),
        getStatisticsOverview(defaultStatisticsFilter).catch(() => null),
      ])
      setNotices(noticeData)
      setFeeMonths(feeMonthData)
      setMemberStats(statsData)
      setStatisticsOverview(overviewData)

      const defaultStatMemberId = statsData[0]?.memberId ?? memberData[0]?.id ?? 0
      if (defaultStatMemberId) {
        setSelectedStatMemberId(defaultStatMemberId)
        setSelectedMemberStat(await getMemberStatistic(defaultStatMemberId, defaultStatisticsFilter))
      }

      setCombinationMemberIds(memberData.slice(0, 2).map((member) => member.id))

      const defaultFeeMonthId = feeMonthData[0]?.id ?? 0
      if (defaultFeeMonthId) {
        await loadFees(defaultFeeMonthId)
      }

      if (defaultGameDayId) {
        const [teamData, resultData] = await Promise.all([getTeams(defaultGameDayId), getGameResults(defaultGameDayId)])
        setTeams(teamData)
        setGameResults(resultData)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "일부 데이터를 불러오지 못했습니다.")
    }

    if (dashboardData.nextGameDay?.id && dashboardData.nextGameDay.id !== defaultGameDayId) {
      try {
        setDashboardAttendanceVotes(await getAttendanceVotes(dashboardData.nextGameDay.id))
      } catch {
        setDashboardAttendanceVotes([])
      }
    }
  }

  async function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requireWriteAccess()) return
    setSavingMember(true)
    setError(null)

    try {
      if (editingMemberId) {
        const updated = await updateMember(editingMemberId, memberForm)
        setMembers((current) => current.map((member) => (member.id === updated.id ? updated : member)))
        setMemberStats((current) =>
          current.map((stat) => (stat.memberId === updated.id ? { ...stat, memberName: updated.name } : stat)),
        )
        setSelectedMemberStat((current) =>
          current?.memberId === updated.id ? { ...current, memberName: updated.name } : current,
        )
        setEditingMemberId(null)
      } else {
        const created = await createMember(memberForm)
        setMembers((current) => [created, ...current])
      }
      setMemberForm(emptyMemberForm)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "회원을 저장하지 못했습니다.")
    } finally {
      setSavingMember(false)
    }
  }

  async function createGuestMember(payload: MemberRequest) {
    if (!requireWriteAccess() || !requireTeamBuilderAccess()) return null
    setSavingTeam(true)
    setError(null)

    try {
      const created = await createMember({ ...payload, status: "GUEST" })
      setMembers((current) => [created, ...current])
      return created
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "게스트를 추가하지 못했습니다.")
      return null
    } finally {
      setSavingTeam(false)
    }
  }

  function startEditMember(member: Member) {
    if (!requireWriteAccess()) return
    setEditingMemberId(member.id)
    setMemberForm({
      name: member.name,
      birthYear: member.birthYear,
      height: member.height,
      position: normalizeMemberPosition(member.position ?? ""),
        region: member.region ?? "",
        role: member.role ?? "NONE",
        status: member.status,
        restUntilDate: member.restUntilDate,
        memo: member.memo ?? "",
      })
  }

  function cancelEditMember() {
    setEditingMemberId(null)
    setMemberForm(emptyMemberForm)
  }

  async function loadLinkableMembers() {
    setLoading(true)
    setError(null)

    try {
      setLinkableMembers(await getLinkableMembers())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "연동 가능한 회원을 확인하지 못했습니다.")
    } finally {
      setLoading(false)
    }
  }

  function normalizeMemberPosition(position: string) {
    const normalized = position.toUpperCase().replace(/\s/g, "")

    if (!normalized) {
      return ""
    }

    if (position.includes("가드") || normalized.includes("PG") || normalized.includes("SG") || normalized === "G") {
      return "가드"
    }

    if (position.includes("포워드") || normalized.includes("SF") || normalized.includes("PF") || normalized === "F") {
      return "포워드"
    }

    if (position.includes("센터") || normalized.includes("C")) {
      return "센터"
    }

    return position
  }

  async function saveMemberProfileImage(memberId: number, profileImageUrl: string) {
    if (!requireWriteAccess()) return
    setError(null)

    try {
      const updated = await updateMemberProfileImage(memberId, profileImageUrl)
      setMembers((current) => current.map((member) => (member.id === updated.id ? updated : member)))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "프로필 사진을 저장하지 못했습니다.")
      throw cause
    }
  }

  async function submitGame(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requireWriteAccess()) return
    setSavingGame(true)
    setError(null)

    try {
      const payload = {
        ...gameForm,
        place: gameForm.place.trim() || emptyGameForm.place,
        startTime: gameForm.startTime || emptyGameForm.startTime,
        endTime: gameForm.endTime || emptyGameForm.endTime,
        gameType: gameForm.gameType || emptyGameForm.gameType,
      }
      if (editingGameDayId) {
        const updated = await updateGameDay(editingGameDayId, payload)
        setGameDays((current) => current.map((gameDay) => (gameDay.id === updated.id ? updated : gameDay)))
        setEditingGameDayId(null)
      } else {
        const created = await createGameDay(payload)
        setGameDays((current) => [created, ...current])
      }
      setGameForm(emptyGameForm)
      setDashboard(await getDashboard())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "경기 일정을 저장하지 못했습니다.")
    } finally {
      setSavingGame(false)
    }
  }

  function startEditGameDay(gameDay: GameDay) {
    if (!requireWriteAccess()) return
    setEditingGameDayId(gameDay.id)
    setGameForm({
      gameDate: gameDay.gameDate,
      place: gameDay.place,
      startTime: gameDay.startTime.slice(0, 5),
      endTime: gameDay.endTime.slice(0, 5),
      mode: gameDay.mode,
      gameType: gameDay.gameType || "REGULAR",
      status: gameDay.status,
      memo: gameDay.memo ?? "",
      teamBuilderMemberId: gameDay.teamBuilderMemberId ?? null,
    })
  }

  function openSelectedGameDayEditor() {
    if (!requireWriteAccess()) return
    const selectedGameDay = gameDays.find((gameDay) => gameDay.id === selectedGameDayId)
    if (!selectedGameDay) {
      return
    }

    startEditGameDay(selectedGameDay)
    navigateToView("games")
  }

  function cancelEditGameDay() {
    setEditingGameDayId(null)
    setGameForm(emptyGameForm)
  }

  function confirmDelete(label: string) {
    return window.confirm(`${label} 삭제할까요? 이 작업은 되돌릴 수 없습니다.`)
  }

  function getDeleteErrorMessage(cause: unknown, fallback: string) {
    const message = cause instanceof Error ? cause.message : fallback
    const lowerMessage = message.toLowerCase()

    if (
      lowerMessage.includes("constraint") ||
      lowerMessage.includes("foreign key") ||
      lowerMessage.includes("cannot delete") ||
      lowerMessage.includes("referential") ||
      lowerMessage.includes("violates")
    ) {
      return "연결된 데이터가 있어서 삭제할 수 없습니다. 실제 운영에서는 삭제보다 상태 변경을 먼저 사용하세요."
    }

    return message
  }

  async function removeMember(id: number) {
    if (!requireWriteAccess()) return
    if (!confirmDelete("회원을")) {
      return
    }

    setError(null)
    try {
      await deleteMember(id)
      setMembers((current) => current.filter((member) => member.id !== id))
      setMemberStats((current) => current.filter((stat) => stat.memberId !== id))
      setCombinationMemberIds((current) => current.filter((memberId) => memberId !== id))
      if (selectedStatMemberId === id) {
        setSelectedStatMemberId(0)
        setSelectedMemberStat(null)
      }
      if (editingMemberId === id) {
        cancelEditMember()
      }
      setDashboard(await getDashboard())
    } catch (cause) {
      setError(getDeleteErrorMessage(cause, "회원을 삭제하지 못했습니다."))
    }
  }

  async function deleteGuestFromTeamBuilder(member: Member) {
    if (!requireWriteAccess() || !requireTeamBuilderAccess()) return false
    if (member.status !== "GUEST") {
      setError("게스트만 팀 구성 화면에서 삭제할 수 있습니다.")
      return false
    }

    setSavingTeam(true)
    setError(null)

    try {
      const nextTeams = [...teams]

      for (const team of teams) {
        if (!team.members.some((teamMember) => teamMember.memberId === member.id)) {
          continue
        }

        const nextMembers = team.members
          .filter((teamMember) => teamMember.memberId !== member.id)
          .map((teamMember) => ({
            memberId: teamMember.memberId,
            playerName: teamMember.memberId ? "" : teamMember.playerName,
          }))

        if (nextMembers.length === 0) {
          await deleteTeam(team.id)
          const index = nextTeams.findIndex((currentTeam) => currentTeam.id === team.id)
          if (index >= 0) {
            nextTeams.splice(index, 1)
          }
          continue
        }

        const updated = await updateTeam(team.id, {
          gameDayId: team.gameDayId,
          name: team.name,
          captainMemberId: null,
          memo: team.memo ?? "",
          members: nextMembers,
        })
        const index = nextTeams.findIndex((currentTeam) => currentTeam.id === updated.id)
        if (index >= 0) {
          nextTeams[index] = updated
        }
      }

      await deleteMember(member.id)
      setTeams(nextTeams)
      setMembers((current) => current.filter((currentMember) => currentMember.id !== member.id))
      setMemberStats((current) => current.filter((stat) => stat.memberId !== member.id))
      setCombinationMemberIds((current) => current.filter((memberId) => memberId !== member.id))
      setGameDays(await getGameDays())
      setDashboard(await getDashboard())
      return true
    } catch (cause) {
      setError(getDeleteErrorMessage(cause, "게스트를 삭제하지 못했습니다. 이미 다른 기록에 연결되어 있을 수 있습니다."))
      return false
    } finally {
      setSavingTeam(false)
    }
  }

  async function openDashboardResults() {
    const gameDayId = dashboard?.recentResults[0]?.gameDayId
    if (gameDayId) {
      await loadAttendance(gameDayId)
    }
    setGameOperationModal("results")
    setView("games")
    pushAppHistory("games", "results", gameDayId || selectedGameDayId)
  }

  function openDashboardNotices() {
    navigateToView("notices")
  }

  async function openGameOperation(gameDayId: number, operationView: GameOperationView) {
    await loadAttendance(gameDayId)
    setGameOperationModal(operationView)
    setView("games")
    pushAppHistory("games", operationView, gameDayId)
  }

  function closeGameOperationModal() {
    if (gameOperationModal === "teams" && canEditSelectedGameDayTeams()) {
      const gameDay = gameDays.find((currentGameDay) => currentGameDay.id === selectedGameDayId)
      const validationIssues = getTeamValidationIssues(gameDay, teams, members)

      if (hasBlockingValidationIssue(validationIssues)) {
        setTeamValidationConfirm({
          action: "close",
          title: "팀 구성을 닫을까요?",
          description: "닫기 전에 확인이 필요한 팀 구성 항목이 남아 있습니다.",
          confirmLabel: "그래도 닫기",
          issues: validationIssues,
        })
        return
      }
    }

    if (gameOperationModal === "results") {
      const gameDay = gameDays.find((currentGameDay) => currentGameDay.id === selectedGameDayId)
      const validationIssues = getResultValidationIssues(gameDay, gameResults)

      if (hasBlockingValidationIssue(validationIssues)) {
        setTeamValidationConfirm({
          action: "close",
          title: "결과 입력을 닫을까요?",
          description: "닫기 전에 확인이 필요한 경기 결과 항목이 남아 있습니다.",
          confirmLabel: "그래도 닫기",
          issues: validationIssues,
        })
        return
      }
    }

    cancelEditResult()
    const currentState = window.history.state as Partial<AppHistoryState> | null
    if (currentState?.rebornApp && currentState.gameOperationModal) {
      window.history.back()
      return
    }

    setGameOperationModal(null)
    replaceAppHistory(view, null)
  }

  function confirmTeamValidationAction() {
    const action = teamValidationConfirm?.action
    setTeamValidationConfirm(null)

    if (action === "close") {
      cancelEditResult()
      const currentState = window.history.state as Partial<AppHistoryState> | null
      if (currentState?.rebornApp && currentState.gameOperationModal) {
        window.history.back()
        return
      }

      setGameOperationModal(null)
      replaceAppHistory(view, null)
    }
  }

  function normalizeResultFormForGameDay(form: GameResultRequest, gameDayId: number): GameResultRequest {
    const selectedGameDay = gameDays.find((gameDay) => gameDay.id === gameDayId)
    if (selectedGameDay?.mode !== "TWO_WAY") {
      return form
    }

    return {
      ...form,
      team1Name: normalizeTwoWayTeam(form.team1Name, "BLACK"),
      team2Name: normalizeTwoWayTeam(form.team2Name, "WHITE"),
    }
  }

  function normalizeTwoWayTeam(teamName: TeamName, fallback: TeamName): TeamName {
    return teamName === "RED" ? fallback : teamName
  }

  async function loadAttendance(gameDayId: number) {
    if (!gameDayId) {
      setAttendanceVotes([])
      setAttendanceSummary(null)
      return null
    }

    setSelectedGameDayId(gameDayId)
    setEditingAttendanceVoteId(null)
    setEditingResultId(null)
    setAttendanceForm((current) => ({ ...current, gameDayId }))
    const [votes, summary, teamData, resultData] = await Promise.all([
      getAttendanceVotes(gameDayId),
      getAttendanceSummary(gameDayId),
      getTeams(gameDayId),
      getGameResults(gameDayId),
    ])
    setAttendanceVotes(votes)
    if (dashboard?.nextGameDay?.id === gameDayId) {
      setDashboardAttendanceVotes(votes)
    }
    setAttendanceSummary(summary)
    setTeams(teamData)
    setGameResults(resultData)
    setResultForm((current) => normalizeResultFormForGameDay({ ...current, gameDayId }, gameDayId))

    return { votes, summary, teams: teamData, results: resultData }
  }

  async function submitAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requireWriteAccess()) return
    setSavingAttendance(true)
    setError(null)

    try {
      const payload = {
        ...attendanceForm,
        memberId: attendanceForm.memberId || null,
        voterName: attendanceForm.memberId ? "" : attendanceForm.voterName,
      }
      if (editingAttendanceVoteId) {
        const updated = await updateAttendanceVote(editingAttendanceVoteId, payload)
        setAttendanceVotes((current) => current.map((vote) => (vote.id === updated.id ? updated : vote)))
        if (dashboard?.nextGameDay?.id === updated.gameDayId) {
          setDashboardAttendanceVotes((current) => current.map((vote) => (vote.id === updated.id ? updated : vote)))
        }
        setEditingAttendanceVoteId(null)
      } else {
        const created = await createAttendanceVote(payload)
        setAttendanceVotes((current) => [created, ...current])
        if (dashboard?.nextGameDay?.id === created.gameDayId) {
          setDashboardAttendanceVotes((current) => [created, ...current])
        }
      }
      setAttendanceForm({ ...emptyAttendanceForm, gameDayId: selectedGameDayId })
      setAttendanceSummary(await getAttendanceSummary(selectedGameDayId))
      setDashboard(await getDashboard())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "참석 투표를 저장하지 못했습니다.")
    } finally {
      setSavingAttendance(false)
    }
  }

  function startEditAttendanceVote(vote: AttendanceVote) {
    if (!requireWriteAccess()) return
    setEditingAttendanceVoteId(vote.id)
    setAttendanceForm({
      gameDayId: vote.gameDayId,
      memberId: vote.memberId,
      voterName: vote.memberId ? "" : vote.voterName,
      status: vote.status,
      memo: vote.memo ?? "",
    })
  }

  function cancelEditAttendanceVote() {
    setEditingAttendanceVoteId(null)
    setAttendanceForm({ ...emptyAttendanceForm, gameDayId: selectedGameDayId })
  }

  async function submitDashboardAttendance(memberId: number, status: AttendanceStatus) {
    if (!requireWriteAccess()) return
    const gameDayId = dashboard?.nextGameDay?.id
    if (!gameDayId) {
      return
    }

    setSavingAttendance(true)
    setError(null)

    try {
      const payload = {
        gameDayId,
        memberId,
        voterName: "",
        status,
        memo: "",
      }
      const existingVote = dashboardAttendanceVotes.find((vote) => vote.gameDayId === gameDayId && vote.memberId === memberId)
      const saved = existingVote ? await updateAttendanceVote(existingVote.id, payload) : await createAttendanceVote(payload)
      setDashboardAttendanceVotes((current) =>
        existingVote ? current.map((vote) => (vote.id === saved.id ? saved : vote)) : [saved, ...current],
      )
      if (selectedGameDayId === gameDayId) {
        setAttendanceVotes((current) =>
          existingVote ? current.map((vote) => (vote.id === saved.id ? saved : vote)) : [saved, ...current],
        )
        setAttendanceSummary(await getAttendanceSummary(gameDayId))
      }
      setDashboard(await getDashboard())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "참석 투표를 저장하지 못했습니다.")
    } finally {
      setSavingAttendance(false)
    }
  }

  async function moveTeamMember(memberId: number, targetTeamName: TeamName | null) {
    if (!requireWriteAccess() || !requireTeamBuilderAccess()) return
    const member = members.find((currentMember) => currentMember.id === memberId)

    if (!member || !selectedGameDayId) {
      return
    }

    setSavingTeam(true)
    setError(null)

    try {
      const teamMembers = new Map<TeamName, TeamRequest["members"]>()
      const affectedTeamNames = new Set<TeamName>()

      for (const team of teams) {
        const nextMembers = team.members
          .filter((teamMember) => teamMember.memberId !== memberId)
          .map((teamMember) => ({
            memberId: teamMember.memberId,
            playerName: teamMember.memberId ? "" : teamMember.playerName,
          }))

        teamMembers.set(team.name, nextMembers)

        if (nextMembers.length !== team.members.length) {
          affectedTeamNames.add(team.name)
        }
      }

      if (targetTeamName) {
        const nextTargetMembers = teamMembers.get(targetTeamName) ?? []
        nextTargetMembers.push({ memberId, playerName: "" })
        teamMembers.set(targetTeamName, nextTargetMembers)
        affectedTeamNames.add(targetTeamName)
      }

      const nextTeams = [...teams]

      for (const teamName of affectedTeamNames) {
        const existingTeam = teams.find((team) => team.name === teamName)
        const nextMembers = teamMembers.get(teamName) ?? []

        if (existingTeam && nextMembers.length === 0) {
          await deleteTeam(existingTeam.id)
          const index = nextTeams.findIndex((team) => team.id === existingTeam.id)
          if (index >= 0) {
            nextTeams.splice(index, 1)
          }
          continue
        }

        const payload: TeamRequest = {
          gameDayId: selectedGameDayId,
          name: teamName,
          captainMemberId: null,
          memo: existingTeam?.memo ?? "",
          members: nextMembers,
        }

        if (existingTeam) {
          const updated = await updateTeam(existingTeam.id, payload)
          const index = nextTeams.findIndex((team) => team.id === updated.id)
          if (index >= 0) {
            nextTeams[index] = updated
          }
        } else {
          const created = await createTeam(payload)
          nextTeams.push(created)
        }
      }

      setTeams(nextTeams)
      setGameDays(await getGameDays())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "팀 배정을 저장하지 못했습니다.")
    } finally {
      setSavingTeam(false)
    }
  }

  async function resetTeamsToPool() {
    if (!requireWriteAccess() || !requireTeamBuilderAccess()) return
    if (!teams.length) {
      return
    }

    setSavingTeam(true)
    setError(null)

    try {
      await Promise.all(teams.map((team) => deleteTeam(team.id)))
      setTeams([])
      setGameDays(await getGameDays())
    } catch (cause) {
      setError(getDeleteErrorMessage(cause, "팀 배정을 초기화하지 못했습니다."))
    } finally {
      setSavingTeam(false)
    }
  }

  async function submitResult(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requireWriteAccess()) return
    setSavingResult(true)
    setError(null)

    try {
      const payload = { ...resultForm, gameDayId: selectedGameDayId }
      if (editingResultId) {
        const updated = await updateGameResult(editingResultId, payload)
        setGameResults((current) => current.map((result) => (result.id === updated.id ? updated : result)))
        setEditingResultId(null)
      } else {
        const created = await createGameResult(payload)
        setGameResults((current) => [created, ...current])
      }
      setResultForm(normalizeResultFormForGameDay({ ...emptyResultForm, gameDayId: selectedGameDayId }, selectedGameDayId))
      setDashboard(await getDashboard())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "경기 결과를 저장하지 못했습니다.")
    } finally {
      setSavingResult(false)
    }
  }

  function startEditResult(result: GameResult) {
    if (!requireWriteAccess()) return
    setEditingResultId(result.id)
    setResultForm(normalizeResultFormForGameDay({
      gameDayId: result.gameDayId,
      matchNo: result.matchNo,
      quarterNo: result.quarterNo,
      team1Name: result.team1Name,
      team2Name: result.team2Name,
      team1Score: result.team1Score,
      team2Score: result.team2Score,
      memo: "",
    }, result.gameDayId))
  }

  function cancelEditResult() {
    setEditingResultId(null)
    setResultForm(normalizeResultFormForGameDay({ ...emptyResultForm, gameDayId: selectedGameDayId }, selectedGameDayId))
  }

  async function submitNotice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requireWriteAccess()) return
    setSavingNotice(true)
    setError(null)

    try {
      if (editingNoticeId) {
        const updated = await updateNotice(editingNoticeId, noticeForm)
        setNotices((current) => current.map((notice) => (notice.id === updated.id ? updated : notice)))
        setEditingNoticeId(null)
      } else {
        const created = await createNotice(noticeForm)
        setNotices((current) => [created, ...current])
      }
      setNoticeForm(emptyNoticeForm)
      setDashboard(await getDashboard())
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "공지를 저장하지 못했습니다.")
    } finally {
      setSavingNotice(false)
    }
  }

  function startEditNotice(notice: Notice) {
    if (!requireWriteAccess()) return
    setEditingNoticeId(notice.id)
    setNoticeForm({
      title: notice.title,
      content: notice.content,
      authorName: notice.authorName,
      pinned: notice.pinned,
    })
  }

  function cancelEditNotice() {
    setEditingNoticeId(null)
    setNoticeForm(emptyNoticeForm)
  }

  async function loadFees(feeMonthId: number) {
    if (!feeMonthId) {
      setSelectedFeeMonthId(0)
      setFeePayments([])
      setFeeExpenses([])
      setFeeSummary(null)
      setEditingFeePaymentId(null)
      setEditingFeeExpenseId(null)
      return
    }

    setSelectedFeeMonthId(feeMonthId)
    setEditingFeePaymentId(null)
    setEditingFeeExpenseId(null)
    setFeePaymentForm((current) => ({ ...current, feeMonthId }))
    setFeeExpenseForm((current) => ({ ...current, feeMonthId }))
    const [payments, expenses, summary] = await Promise.all([
      getFeePayments(feeMonthId),
      getFeeExpenses(feeMonthId),
      getFeeSummary(feeMonthId),
    ])
    setFeePayments(payments)
    setFeeExpenses(expenses)
    setFeeSummary(summary)
  }

  async function submitFeeMonth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requireWriteAccess()) return
    setSavingFee(true)
    setError(null)

    try {
      if (editingFeeMonthId) {
        const updated = await updateFeeMonth(editingFeeMonthId, feeMonthForm)
        setFeeMonths((current) => current.map((feeMonth) => (feeMonth.id === updated.id ? updated : feeMonth)))
        setEditingFeeMonthId(null)
        await loadFees(updated.id)
      } else {
        const created = await createFeeMonth(feeMonthForm)
        setFeeMonths((current) => [created, ...current])
        await loadFees(created.id)
      }
      setFeeMonthForm(emptyFeeMonthForm)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "회비 월을 저장하지 못했습니다.")
    } finally {
      setSavingFee(false)
    }
  }

  function startEditFeeMonth(feeMonth: FeeMonth) {
    if (!requireWriteAccess()) return
    setEditingFeeMonthId(feeMonth.id)
    setFeeMonthForm({
      year: feeMonth.year,
      month: feeMonth.month,
      roundCount: feeMonth.roundCount,
      regularFeeAmount: feeMonth.regularFeeAmount,
      guestFeeAmount: feeMonth.guestFeeAmount,
      memo: feeMonth.memo ?? "",
    })
  }

  function cancelEditFeeMonth() {
    setEditingFeeMonthId(null)
    setFeeMonthForm(emptyFeeMonthForm)
  }

  async function submitFeePayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requireWriteAccess()) return
    setSavingFee(true)
    setError(null)

    try {
      const payload = {
        ...feePaymentForm,
        feeMonthId: selectedFeeMonthId,
        memberId: feePaymentForm.memberId || null,
        payerName: feePaymentForm.memberId ? "" : feePaymentForm.payerName,
        paidDate: feePaymentForm.status === "PAID" ? feePaymentForm.paidDate : null,
      }
      if (editingFeePaymentId) {
        await updateFeePayment(editingFeePaymentId, payload)
        setEditingFeePaymentId(null)
      } else {
        await createFeePayment(payload)
      }
      setFeePaymentForm({ ...emptyFeePaymentForm, feeMonthId: selectedFeeMonthId })
      await loadFees(selectedFeeMonthId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "납부 내역을 저장하지 못했습니다.")
    } finally {
      setSavingFee(false)
    }
  }

  function startEditFeePayment(payment: FeePayment) {
    if (!requireWriteAccess()) return
    setEditingFeePaymentId(payment.id)
    setFeePaymentForm({
      feeMonthId: payment.feeMonthId,
      memberId: payment.memberId,
      payerName: payment.memberId ? "" : payment.payerName,
      amount: payment.amount,
      status: payment.status,
      paidDate: payment.paidDate ?? "",
      memo: payment.memo ?? "",
    })
  }

  function cancelEditFeePayment() {
    setEditingFeePaymentId(null)
    setFeePaymentForm({ ...emptyFeePaymentForm, feeMonthId: selectedFeeMonthId })
  }

  async function submitFeeExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!requireWriteAccess()) return
    setSavingFee(true)
    setError(null)

    try {
      const payload = { ...feeExpenseForm, feeMonthId: selectedFeeMonthId }
      if (editingFeeExpenseId) {
        await updateFeeExpense(editingFeeExpenseId, payload)
        setEditingFeeExpenseId(null)
      } else {
        await createFeeExpense(payload)
      }
      setFeeExpenseForm({ ...emptyFeeExpenseForm, feeMonthId: selectedFeeMonthId })
      await loadFees(selectedFeeMonthId)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "지출 내역을 저장하지 못했습니다.")
    } finally {
      setSavingFee(false)
    }
  }

  function startEditFeeExpense(expense: FeeExpense) {
    if (!requireWriteAccess()) return
    setEditingFeeExpenseId(expense.id)
    setFeeExpenseForm({
      feeMonthId: expense.feeMonthId,
      title: expense.title,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      memo: expense.memo ?? "",
    })
  }

  function cancelEditFeeExpense() {
    setEditingFeeExpenseId(null)
    setFeeExpenseForm({ ...emptyFeeExpenseForm, feeMonthId: selectedFeeMonthId })
  }

  async function removeAttendanceVote(id: number) {
    if (!requireWriteAccess()) return
    if (!confirmDelete("참석 투표를")) {
      return
    }

    setError(null)
    try {
      await deleteAttendanceVote(id)
      setAttendanceVotes((current) => current.filter((vote) => vote.id !== id))
      setDashboardAttendanceVotes((current) => current.filter((vote) => vote.id !== id))
      if (editingAttendanceVoteId === id) {
        cancelEditAttendanceVote()
      }
      if (selectedGameDayId) {
        setAttendanceSummary(await getAttendanceSummary(selectedGameDayId))
        setDashboard(await getDashboard())
      }
    } catch (cause) {
      setError(getDeleteErrorMessage(cause, "참석 투표를 삭제하지 못했습니다."))
    }
  }

  async function removeNotice(id: number) {
    if (!requireWriteAccess()) return
    if (!confirmDelete("게시글을")) {
      return
    }

    setError(null)
    try {
      await deleteNotice(id)
      setNotices((current) => current.filter((notice) => notice.id !== id))
      setDashboard(await getDashboard())
    } catch (cause) {
      setError(getDeleteErrorMessage(cause, "공지를 삭제하지 못했습니다."))
    }
  }

  async function removeFeePayment(id: number) {
    if (!requireWriteAccess()) return
    if (!confirmDelete("납부 내역을")) {
      return
    }

    setError(null)
    try {
      await deleteFeePayment(id)
      if (editingFeePaymentId === id) {
        cancelEditFeePayment()
      }
      await loadFees(selectedFeeMonthId)
    } catch (cause) {
      setError(getDeleteErrorMessage(cause, "납부 내역을 삭제하지 못했습니다."))
    }
  }

  async function removeFeeMonth(id: number) {
    if (!requireWriteAccess()) return
    if (!confirmDelete("회비 월을")) {
      return
    }

    setError(null)
    try {
      await deleteFeeMonth(id)
      const nextFeeMonths = feeMonths.filter((feeMonth) => feeMonth.id !== id)
      setFeeMonths(nextFeeMonths)
      if (editingFeeMonthId === id) {
        cancelEditFeeMonth()
      }
      if (selectedFeeMonthId === id) {
        const nextFeeMonthId = nextFeeMonths[0]?.id ?? 0
        if (nextFeeMonthId) {
          await loadFees(nextFeeMonthId)
        } else {
          await loadFees(0)
        }
      }
    } catch (cause) {
      setError(getDeleteErrorMessage(cause, "회비 월을 삭제하지 못했습니다."))
    }
  }

  async function removeFeeExpense(id: number) {
    if (!requireWriteAccess()) return
    if (!confirmDelete("지출 내역을")) {
      return
    }

    setError(null)
    try {
      await deleteFeeExpense(id)
      if (editingFeeExpenseId === id) {
        cancelEditFeeExpense()
      }
      await loadFees(selectedFeeMonthId)
    } catch (cause) {
      setError(getDeleteErrorMessage(cause, "지출 내역을 삭제하지 못했습니다."))
    }
  }

  async function loadMemberStat(memberId: number) {
    if (!memberId) {
      setSelectedMemberStat(null)
      setSelectedStatMemberId(0)
      return
    }

    setSelectedStatMemberId(memberId)
    setSelectedMemberStat(await getMemberStatistic(memberId, statisticsFilter))
  }

  async function loadCombinationStat(memberIds: number[]) {
    setCombinationMemberIds(memberIds)
    if (memberIds.length < 2) {
      setCombinationStat(null)
      return
    }

    setCombinationStat(await getCombinationStatistics(memberIds, statisticsFilter))
  }

  async function changeStatisticsFilter(filter: StatisticsFilter) {
    setStatisticsFilter(filter)
    const statsData = await getMemberStatistics(filter)
    const overviewData = await getStatisticsOverview(filter).catch(() => null)
    setMemberStats(statsData)
    setStatisticsOverview(overviewData)

    const nextMemberId = statsData.some((stat) => stat.memberId === selectedStatMemberId)
      ? selectedStatMemberId
      : statsData[0]?.memberId || 0
    if (nextMemberId) {
      setSelectedStatMemberId(nextMemberId)
      setSelectedMemberStat(await getMemberStatistic(nextMemberId, filter))
    } else {
      setSelectedMemberStat(null)
    }

    if (combinationMemberIds.length >= 2) {
      setCombinationStat(await getCombinationStatistics(combinationMemberIds, filter))
    } else {
      setCombinationStat(null)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const kakaoCode = params.get("code")
    const kakaoState = params.get("state")
    const expectedState = sessionStorage.getItem("reborn-kakao-state")

    if (kakaoCode && (!kakaoState || kakaoState === expectedState)) {
      setKakaoLoginLoading(true)
      void completeKakaoLogin(kakaoCode, `${window.location.origin}${window.location.pathname}`)
        .then((response) => saveAuthSession(authResponseToSession(response)))
        .catch((cause) => setError(cause instanceof Error ? cause.message : "카카오 로그인에 실패했습니다."))
        .finally(() => {
          sessionStorage.removeItem("reborn-kakao-state")
          window.history.replaceState(null, "", window.location.pathname)
          setKakaoLoginLoading(false)
        })
    }
  }, [])

  useEffect(() => {
    if (!authSession) {
      return
    }

    if (authSession.mode === "member" && !authSession.linked) {
      void loadLinkableMembers()
      return
    }

    void loadAll()
  }, [authSession])

  useEffect(() => {
    if (!authSession || (authSession.mode === "member" && !authSession.linked)) {
      return
    }

    const currentState = window.history.state as Partial<AppHistoryState> | null
    if (!currentState?.rebornApp) {
      replaceAppHistory(view, gameOperationModal, selectedGameDayId)
    }

    function handlePopState(event: PopStateEvent) {
      const state = event.state as Partial<AppHistoryState> | null
      if (!state?.rebornApp || !state.view) {
        setGameOperationModal(null)
        setView("dashboard")
        return
      }

      setView(state.view)
      setGameOperationModal(state.gameOperationModal ?? null)
      if (state.selectedGameDayId) {
        void loadAttendance(state.selectedGameDayId)
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [authSession, gameOperationModal, selectedGameDayId, view])

  if (!authSession) {
    return (
      <>
        <EntranceScreen onGuest={enterAsGuest} onKakao={loginWithKakao} kakaoLoginLoading={kakaoLoginLoading} />
        <CenterLoadingOverlay open={kakaoLoginLoading} message="카카오 로그인을 준비 중입니다." />
      </>
    )
  }

  if (authSession.mode === "member" && !authSession.linked) {
    return (
      <MemberLinkScreen
        loading={loading}
        members={linkableMembers}
        nickname={authSession.name}
        onCreateFirstMember={(payload) => void createFirstMemberAndLink(payload)}
        onLink={(memberId) => void linkCurrentMember(memberId)}
        onLogout={logout}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <GlobalBusyIndicator message={busyMessage} />
      <CenterLoadingOverlay open={kakaoLoginLoading} message="카카오 로그인을 확인 중입니다." />
      <div className="court-lines" />
      <AccountStatusChip
        className="fixed right-3 top-3 z-50 sm:hidden"
        session={authSession}
        readOnly={readOnly}
        onLogout={logout}
      />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-center lg:justify-between">
          <button
            className="group flex w-fit items-center gap-3 text-left outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-ring"
            type="button"
            aria-label="메인 화면으로 이동"
            onClick={() => navigateToView("dashboard")}
          >
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-900 bg-zinc-950 shadow-sm shadow-slate-900/10 transition-transform group-hover:-translate-y-0.5">
              <span className="absolute h-9 w-9 rounded-full border-[3px] border-white/90" />
              <span className="absolute h-9 w-[3px] rounded-full bg-white/75" />
              <span className="absolute h-[3px] w-9 rounded-full bg-white/75" />
              <span className="absolute h-11 w-11 rounded-full border-l-[3px] border-r-[3px] border-white/55" />
              <span className="absolute -right-1 bottom-1 h-3 w-3 rounded-full border border-zinc-950 bg-accent" />
            </span>
            <span>
              <span className="block text-2xl font-black leading-none text-foreground sm:text-3xl">
                RE<span className="text-accent">:</span>BORN
              </span>
              <span className="mt-1 block text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Basketball Club</span>
            </span>
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:justify-end">
            <nav className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-secondary/70 p-1.5 shadow-sm shadow-slate-900/5 sm:grid-cols-5">
              <TabButton active={view === "dashboard"} icon={LayoutDashboard} onClick={() => navigateToView("dashboard")}>
                대시보드
              </TabButton>
              <TabButton active={view === "members"} icon={UsersRound} onClick={() => navigateToView("members")}>
                회원
              </TabButton>
              <TabButton active={view === "games"} icon={Trophy} onClick={() => navigateToView("games")}>
                게임기록
              </TabButton>
              <TabButton active={view === "notices"} icon={MessageSquareText} onClick={() => navigateToView("notices")}>
                게시판
              </TabButton>
              <TabButton active={view === "stats"} icon={BarChart3} onClick={() => navigateToView("stats")}>
                통계
              </TabButton>
            </nav>
            <AccountStatusChip className="hidden sm:flex" session={authSession} readOnly={readOnly} onLogout={logout} />
          </div>
        </header>

        {error ? (
          <section className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </section>
        ) : null}

        {view === "dashboard" ? (
          <DashboardView
            dashboard={dashboard}
            loading={loading}
            members={members}
            attendanceVotes={dashboardAttendanceVotes}
            memberStats={memberStats}
            statisticsOverview={statisticsOverview}
            currentMemberId={authSession.memberId ?? null}
            currentMemberVote={dashboardAttendanceVotes.find(
              (vote) => vote.gameDayId === dashboard?.nextGameDay?.id && vote.memberId === authSession.memberId,
            )}
            onOpenMembers={() => navigateToView("members")}
            onOpenResults={() => void openDashboardResults()}
            onOpenNotices={openDashboardNotices}
            onOpenStats={() => navigateToView("stats")}
            onOpenTeams={() => {
              const gameDayId = dashboard?.nextGameDay?.id
              if (gameDayId) {
                void openGameOperation(gameDayId, "teams")
              }
            }}
            onVoteAttendance={(memberId, status) => void submitDashboardAttendance(memberId, status)}
            voting={savingAttendance}
            readOnly={readOnly}
          />
        ) : null}

        {view === "members" ? (
          <MembersView
            members={members}
            form={memberForm}
            editingMemberId={editingMemberId}
            loading={loading}
            saving={savingMember}
            roleHolders={members.filter((member) => member.role !== "NONE")}
            currentMemberId={authSession.memberId ?? null}
            onChange={setMemberForm}
            onSubmit={submitMember}
            onEdit={startEditMember}
            onCancelEdit={cancelEditMember}
            onDelete={(id) => void removeMember(id)}
            onProfileImageUpdate={(memberId, profileImageUrl) => saveMemberProfileImage(memberId, profileImageUrl)}
            readOnly={readOnly}
          />
        ) : null}

        {view === "games" ? (
          <GamesView
            gameDays={gameDays}
            members={members}
            currentGameDayId={selectedGameDayId}
            currentResults={gameResults}
            form={gameForm}
            editingGameDayId={editingGameDayId}
            loading={loading}
            saving={savingGame}
            onChange={setGameForm}
            onSubmit={submitGame}
            onEdit={startEditGameDay}
            onCancelEdit={cancelEditGameDay}
            onOpenTeams={(gameDayId) => void openGameOperation(gameDayId, "teams")}
            onOpenResults={(gameDayId) => void openGameOperation(gameDayId, "results")}
            readOnly={readOnly}
          />
        ) : null}

        {gameOperationModal ? (
          <FormModal
            title={
              <>
                {gameOperationModal === "teams" ? (
                  <UsersRound className="h-5 w-5 text-accent" />
                ) : (
                  <ClipboardList className="h-5 w-5 text-accent" />
                )}
                {gameOperationModal === "teams" ? "팀 구성" : "결과 입력"}
              </>
            }
            size="wide"
            onClose={closeGameOperationModal}
          >
            {gameOperationModal === "teams" ? (
              <TeamsView
                gameDays={gameDays}
                members={members}
                teams={teams}
                selectedGameDayId={selectedGameDayId}
                loading={loading}
                saving={savingTeam}
                validationIssues={getTeamValidationIssues(
                  gameDays.find((gameDay) => gameDay.id === selectedGameDayId),
                  teams,
                  members,
                )}
                onMoveMember={(memberId, teamName) => void moveTeamMember(memberId, teamName)}
                onCreateGuest={createGuestMember}
                onDeleteGuest={deleteGuestFromTeamBuilder}
                onResetTeams={() => void resetTeamsToPool()}
                readOnly={!canEditSelectedGameDayTeams()}
              />
            ) : null}

            {gameOperationModal === "results" ? (
              <ResultsView
                gameDays={gameDays}
                results={gameResults}
                teams={teams}
                selectedGameDayId={selectedGameDayId}
                form={resultForm}
                editingResultId={editingResultId}
                loading={loading}
                saving={savingResult}
                onSelectGameDay={(gameDayId) => void loadAttendance(gameDayId)}
                onChange={(form) => setResultForm(normalizeResultFormForGameDay(form, selectedGameDayId))}
                onSubmit={submitResult}
                onEdit={startEditResult}
                onCancelEdit={cancelEditResult}
                readOnly={readOnly}
              />
            ) : null}
          </FormModal>
        ) : null}

        {teamValidationConfirm ? (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-background/55 px-4 backdrop-blur-[2px]"
            onClick={() => setTeamValidationConfirm(null)}
          >
            <section
              className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-4">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-black">{teamValidationConfirm.title}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                  {teamValidationConfirm.description}
                </p>
              </div>

              <div className="mb-4 grid gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                {teamValidationConfirm.issues.map((issue) => (
                  <p
                    key={issue.message}
                    className={`text-sm font-semibold ${issue.tone === "danger" ? "text-red-700" : "text-amber-700"}`}
                  >
                    {issue.message}
                  </p>
                ))}
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                  type="button"
                  onClick={confirmTeamValidationAction}
                >
                  {teamValidationConfirm.confirmLabel}
                </button>
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
                  type="button"
                  onClick={() => setTeamValidationConfirm(null)}
                >
                  계속 수정
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {view === "attendance" ? (
          <AttendanceView
            gameDays={gameDays}
            members={members}
            votes={attendanceVotes}
            summary={attendanceSummary}
            selectedGameDayId={selectedGameDayId}
            form={attendanceForm}
            editingVoteId={editingAttendanceVoteId}
            loading={loading}
            saving={savingAttendance}
            onSelectGameDay={(gameDayId) => void loadAttendance(gameDayId)}
            onChange={setAttendanceForm}
            onSubmit={submitAttendance}
            onEdit={startEditAttendanceVote}
            onCancelEdit={cancelEditAttendanceVote}
            onDelete={(id) => void removeAttendanceVote(id)}
            onEditGameDay={openSelectedGameDayEditor}
            readOnly={readOnly}
          />
        ) : null}

        {view === "notices" ? (
          <NoticesView
            notices={notices}
            form={noticeForm}
            editingNoticeId={editingNoticeId}
            loading={loading}
            saving={savingNotice}
            onChange={setNoticeForm}
            onSubmit={submitNotice}
            onEdit={startEditNotice}
            onCancelEdit={cancelEditNotice}
            onDelete={(id) => void removeNotice(id)}
            readOnly={readOnly}
          />
        ) : null}

        {view === "fees" ? (
          <FeesView
            feeMonths={feeMonths}
            payments={feePayments}
            expenses={feeExpenses}
            members={members}
            summary={feeSummary}
            selectedFeeMonthId={selectedFeeMonthId}
            monthForm={feeMonthForm}
            paymentForm={feePaymentForm}
            expenseForm={feeExpenseForm}
            editingFeeMonthId={editingFeeMonthId}
            editingPaymentId={editingFeePaymentId}
            editingExpenseId={editingFeeExpenseId}
            loading={loading}
            saving={savingFee}
            onSelectFeeMonth={(feeMonthId) => void loadFees(feeMonthId)}
            onMonthChange={setFeeMonthForm}
            onPaymentChange={setFeePaymentForm}
            onExpenseChange={setFeeExpenseForm}
            onSubmitMonth={submitFeeMonth}
            onSubmitPayment={submitFeePayment}
            onSubmitExpense={submitFeeExpense}
            onEditMonth={startEditFeeMonth}
            onCancelMonthEdit={cancelEditFeeMonth}
            onDeleteMonth={(id) => void removeFeeMonth(id)}
            onEditPayment={startEditFeePayment}
            onCancelPaymentEdit={cancelEditFeePayment}
            onEditExpense={startEditFeeExpense}
            onCancelExpenseEdit={cancelEditFeeExpense}
            onDeletePayment={(id) => void removeFeePayment(id)}
            onDeleteExpense={(id) => void removeFeeExpense(id)}
          />
        ) : null}

        {view === "stats" ? (
          <StatsView
            gameDays={gameDays}
            members={members}
            memberStats={memberStats}
            selectedMemberId={selectedStatMemberId}
            selectedMemberStat={selectedMemberStat}
            combinationMemberIds={combinationMemberIds}
            combinationStat={combinationStat}
            statisticsOverview={statisticsOverview}
            statisticsFilter={statisticsFilter}
            loading={loading}
            onFilterChange={(filter) => void changeStatisticsFilter(filter)}
            onSelectMember={(memberId) => void loadMemberStat(memberId)}
            onSelectCombination={(memberIds) => void loadCombinationStat(memberIds)}
          />
        ) : null}
      </div>
    </main>
  )
}

function getTeamValidationIssues(gameDay: GameDay | undefined, teams: Team[], members: Member[]): TeamValidationIssue[] {
  if (!gameDay) {
    return []
  }

  const expectedTeamNames: TeamName[] = gameDay.mode === "TWO_WAY" ? ["BLACK", "WHITE"] : ["BLACK", "WHITE", "RED"]
  const teamSizes = expectedTeamNames.map((teamName) => teams.find((team) => team.name === teamName)?.members.length ?? 0)
  const assignedRegularMemberIds = new Set(
    teams.flatMap((team) =>
      team.members
        .map((teamMember) => teamMember.memberId)
        .filter((memberId): memberId is number => memberId !== null && members.some((member) => member.id === memberId && member.status === "REGULAR")),
    ),
  )
  const unassignedCount = members.filter((member) => member.status === "REGULAR" && !assignedRegularMemberIds.has(member.id)).length
  const issues: TeamValidationIssue[] = []

  if (unassignedCount > 0) {
    issues.push({
      tone: "warning",
      message: `아직 미배정 인원이 ${unassignedCount}명 있습니다.`,
    })
  }

  if (teamSizes.some((count) => count === 0)) {
    issues.push({
      tone: "danger",
      message: "비어 있는 팀이 있습니다.",
    })
  }

  if (teamSizes.length && Math.max(...teamSizes) - Math.min(...teamSizes) >= 2) {
    issues.push({
      tone: "warning",
      message: `팀 인원 차이가 큽니다. 최대 ${Math.max(...teamSizes) - Math.min(...teamSizes)}명 차이입니다.`,
    })
  }

  return issues
}

function getResultValidationIssues(gameDay: GameDay | undefined, results: GameResult[]): TeamValidationIssue[] {
  if (!gameDay || gameDay.gameType !== "REGULAR" || gameDay.status === "HOLIDAY" || gameDay.status === "CLOSED") {
    return []
  }

  const matchNos = [1, 2, 3]
  const quarters = [1, 2, 3, 4]
  const resultKeys = new Set(results.map((result) => `${result.matchNo}:${result.quarterNo}`))
  const missingSlots = matchNos.flatMap((matchNo) =>
    quarters.filter((quarterNo) => !resultKeys.has(`${matchNo}:${quarterNo}`)).map((quarterNo) => ({ matchNo, quarterNo })),
  )
  const missingFinalCount = matchNos.filter((matchNo) => !resultKeys.has(`${matchNo}:4`)).length
  const issues: TeamValidationIssue[] = []

  if (missingFinalCount > 0) {
    issues.push({
      tone: "danger",
      message: `4Q 최종 점수가 입력되지 않은 경기가 ${missingFinalCount}개 있습니다.`,
    })
  }

  if (missingSlots.length > 0) {
    issues.push({
      tone: "warning",
      message: `아직 입력하지 않은 쿼터 점수가 ${missingSlots.length}칸 있습니다.`,
    })
  }

  return issues
}

function hasBlockingValidationIssue(issues: TeamValidationIssue[]) {
  return issues.some((issue) => issue.tone === "danger")
}

function readAuthSession(): AuthSession | null {
  try {
    const value = localStorage.getItem(authStorageKey)
    if (!value) return null
    const session = JSON.parse(value) as Partial<AuthSession>
    if ((session.mode === "member" || session.mode === "guest") && typeof session.name === "string") {
      return {
        mode: session.mode,
        name: session.name,
        token: session.token,
        memberId: session.memberId,
        memberName: session.memberName,
        memberRole: session.memberRole,
        linked: session.linked,
      }
    }
  } catch {
    localStorage.removeItem(authStorageKey)
  }

  return null
}

function GlobalBusyIndicator({ message }: { message: string | null }) {
  if (!message) {
    return null
  }

  return (
    <>
      <div className="global-loading-bar" aria-hidden="true" />
      <div
        className="fixed bottom-4 right-4 z-[90] inline-flex max-w-[calc(100vw-32px)] items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-bold text-foreground shadow-xl shadow-slate-900/15"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <span>{message}</span>
      </div>
    </>
  )
}

function CenterLoadingOverlay({ open, message }: { open: boolean; message: string }) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm" role="status" aria-live="polite">
      <section className="flex w-full max-w-xs flex-col items-center gap-3 rounded-lg border border-border bg-card px-5 py-6 text-center shadow-2xl shadow-slate-900/20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <div>
          <p className="text-base font-black text-foreground">{message}</p>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">잠시만 기다려주세요.</p>
        </div>
      </section>
    </div>
  )
}

function getBusyMessage({
  loading,
  savingMember,
  savingGame,
  savingAttendance,
  savingTeam,
  savingResult,
  savingNotice,
  savingFee,
}: {
  loading: boolean
  savingMember: boolean
  savingGame: boolean
  savingAttendance: boolean
  savingTeam: boolean
  savingResult: boolean
  savingNotice: boolean
  savingFee: boolean
}) {
  if (savingTeam) return "팀 구성을 저장 중입니다."
  if (savingResult) return "점수를 저장 중입니다."
  if (savingAttendance) return "참석 정보를 저장 중입니다."
  if (savingMember) return "회원 정보를 저장 중입니다."
  if (savingGame) return "경기 일정을 저장 중입니다."
  if (savingNotice) return "게시글을 저장 중입니다."
  if (savingFee) return "회비 정보를 저장 중입니다."
  if (loading) return "데이터를 불러오는 중입니다."

  return null
}

function EntranceScreen({
  onGuest,
  onKakao,
  kakaoLoginLoading,
}: {
  onGuest: () => void
  onKakao: () => void
  kakaoLoginLoading: boolean
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="court-lines" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8">
        <section className="grid w-full gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-stretch">
          <div className="rounded-lg border border-border bg-card p-6 shadow-sm shadow-slate-900/10 sm:p-8">
            <div className="mb-8 flex items-center gap-3">
              <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-zinc-900 bg-zinc-950 shadow-sm shadow-slate-900/10">
                <span className="absolute h-9 w-9 rounded-full border-[3px] border-white/90" />
                <span className="absolute h-9 w-[3px] rounded-full bg-white/75" />
                <span className="absolute h-[3px] w-9 rounded-full bg-white/75" />
                <span className="absolute h-11 w-11 rounded-full border-l-[3px] border-r-[3px] border-white/55" />
                <span className="absolute -right-1 bottom-1 h-3 w-3 rounded-full border border-zinc-950 bg-accent" />
              </span>
              <span>
                <span className="block text-3xl font-black leading-none">
                  RE<span className="text-accent">:</span>BORN
                </span>
                <span className="mt-1 block text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Basketball Club</span>
              </span>
            </div>
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">동호회 운영 화면</h1>
          </div>

          <div className="rounded-lg border border-border bg-secondary/40 p-4 shadow-sm shadow-slate-900/5">
            <div className="grid h-full gap-3">
              <button
                className="rounded-md border border-[#f2d500] bg-[#fee500] px-5 py-4 text-left text-slate-950 transition-transform hover:-translate-y-0.5"
                type="button"
                disabled={kakaoLoginLoading}
                onClick={onKakao}
              >
                <span className="flex items-center gap-2 text-lg font-black">
                  <span className="inline-flex h-6 min-w-9 items-center justify-center rounded-full bg-slate-950 px-2 text-[10px] font-black leading-none text-[#fee500]">
                    TALK
                  </span>
                  {kakaoLoginLoading ? "로그인 준비 중" : "카카오로 로그인"}
                </span>
                <span className="mt-1 block text-sm font-semibold text-slate-700">운영 기능 사용</span>
              </button>
              <button
                className="rounded-md border border-border bg-card px-5 py-4 text-left transition-colors hover:bg-background"
                type="button"
                onClick={onGuest}
              >
                <span className="block text-lg font-black text-foreground">비회원으로 보기</span>
                <span className="mt-1 block text-sm font-semibold text-muted-foreground">회원, 경기, 게시판, 통계 조회만 가능</span>
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function MemberLinkScreen({
  loading,
  members,
  nickname,
  onCreateFirstMember,
  onLink,
  onLogout,
}: {
  loading: boolean
  members: Member[]
  nickname: string
  onCreateFirstMember: (payload: Pick<MemberRequest, "name" | "birthYear" | "height" | "position" | "region">) => void
  onLink: (memberId: number) => void
  onLogout: () => void
}) {
  const linkableMembers = members
    .filter((member) => !member.kakaoLinked)
    .toSorted((left, right) => left.name.localeCompare(right.name, "ko"))
  const [memberSearch, setMemberSearch] = useState("")
  const [firstMemberForm, setFirstMemberForm] = useState({
    name: nickname,
    birthYear: "",
    height: "",
    position: "가드",
    region: "",
  })
  const searchedMembers = linkableMembers.filter((member) => {
    const keyword = memberSearch.trim().toLowerCase()
    if (!keyword) {
      return true
    }

    return [member.name, member.position, member.region].some((value) => value?.toLowerCase().includes(keyword))
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="court-lines" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-4 py-8">
        <section className="w-full rounded-lg border border-border bg-card shadow-sm shadow-slate-900/10">
          <div className="border-b border-border p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-black text-accent">카카오 로그인 완료</p>
                <h1 className="mt-1 text-2xl font-black">회원 연동</h1>
                <p className="mt-2 text-sm font-semibold text-muted-foreground">
                  {nickname} 계정과 연결할 회원을 선택하세요.
                </p>
              </div>
              <button
                className="rounded-md border border-border px-3 py-2 text-sm font-black text-muted-foreground hover:bg-secondary hover:text-foreground"
                type="button"
                onClick={onLogout}
              >
                나가기
              </button>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="min-w-0 flex-1">
                <span className="sr-only">회원 검색</span>
                <input
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-ring"
                  placeholder="이름, 지역, 포지션 검색"
                  value={memberSearch}
                  onChange={(event) => setMemberSearch(event.target.value)}
                />
              </label>
              <span className="text-xs font-black text-muted-foreground">
                {searchedMembers.length}/{linkableMembers.length}명
              </span>
            </div>

            {loading ? (
              <p className="rounded-md border border-border bg-secondary/35 p-4 text-sm font-semibold text-muted-foreground">회원 목록 확인 중</p>
            ) : linkableMembers.length ? (
              searchedMembers.length ? (
                <div className="max-h-[360px] overflow-y-auto pr-1">
                  <div className="grid gap-1.5">
                    {searchedMembers.map((member) => (
                      <button
                        key={member.id}
                        className="flex items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2.5 text-left transition-colors hover:border-accent/45 hover:bg-accent/10"
                        type="button"
                        onClick={() => onLink(member.id)}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black">{member.name}</span>
                          <span className="mt-0.5 block truncate text-xs font-semibold text-muted-foreground">
                            {member.position || "포지션 미상"} · {member.region || "지역 미상"}
                          </span>
                        </span>
                        <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-black text-muted-foreground">
                          선택
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-md border border-border bg-secondary/35 p-4 text-sm font-semibold text-muted-foreground">
                  검색 결과가 없습니다.
                </p>
              )
            ) : (
              <form
                className="rounded-md border border-accent/35 bg-accent/5 p-4"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!firstMemberForm.name.trim()) {
                    return
                  }

                  onCreateFirstMember({
                    name: firstMemberForm.name.trim(),
                    birthYear: firstMemberForm.birthYear ? Number(firstMemberForm.birthYear) : null,
                    height: firstMemberForm.height ? Number(firstMemberForm.height) : null,
                    position: firstMemberForm.position,
                    region: firstMemberForm.region.trim(),
                  })
                }}
              >
                <div className="mb-3">
                  <p className="text-sm font-black text-foreground">최초 관리자 생성</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
                    아직 등록된 회원이 없습니다. 첫 회원을 만들고 이 카카오 계정에 바로 연동합니다.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                    placeholder="이름"
                    value={firstMemberForm.name}
                    onChange={(event) => setFirstMemberForm((current) => ({ ...current, name: event.target.value }))}
                  />
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                    value={firstMemberForm.position}
                    onChange={(event) => setFirstMemberForm((current) => ({ ...current, position: event.target.value }))}
                  >
                    <option value="가드">가드</option>
                    <option value="포워드">포워드</option>
                    <option value="센터">센터</option>
                  </select>
                  <input
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                    inputMode="numeric"
                    placeholder="출생연도"
                    value={firstMemberForm.birthYear}
                    onChange={(event) => setFirstMemberForm((current) => ({ ...current, birthYear: event.target.value.replace(/\D/g, "").slice(0, 4) }))}
                  />
                  <input
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
                    inputMode="numeric"
                    placeholder="키"
                    value={firstMemberForm.height}
                    onChange={(event) => setFirstMemberForm((current) => ({ ...current, height: event.target.value.replace(/\D/g, "").slice(0, 3) }))}
                  />
                  <input
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring sm:col-span-2"
                    placeholder="지역"
                    value={firstMemberForm.region}
                    onChange={(event) => setFirstMemberForm((current) => ({ ...current, region: event.target.value }))}
                  />
                </div>
                <button
                  className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-md bg-accent px-4 text-sm font-black text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
                  type="submit"
                  disabled={loading || !firstMemberForm.name.trim()}
                >
                  {loading ? "생성 중" : "첫 회원 생성 후 연동"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function AccountStatusChip({
  className = "",
  session,
  readOnly,
  onLogout,
}: {
  className?: string
  session: AuthSession
  readOnly: boolean
  onLogout: () => void
}) {
  const initial = readOnly ? "G" : (session.memberName ?? session.name).slice(0, 1)

  return (
    <div className={`justify-end ${className}`}>
      <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2 py-1.5 shadow-sm shadow-slate-900/5 backdrop-blur-sm">
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
            readOnly ? "bg-amber-500/15 text-amber-700" : "bg-foreground text-background"
          }`}
        >
          {initial}
        </span>
        <span className="min-w-0 max-w-24 truncate text-xs font-black text-foreground sm:max-w-28">
          {readOnly ? "비회원" : session.memberName ?? session.name}
        </span>
        <span className={`h-2 w-2 rounded-full ${readOnly ? "bg-amber-500" : "bg-accent"}`} title={readOnly ? "조회 전용" : "로그인"} />
        <button
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          type="button"
          title="나가기"
          onClick={onLogout}
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default App
