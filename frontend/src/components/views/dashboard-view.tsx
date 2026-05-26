import { useEffect, useState } from "react"
import { ArrowRight, BarChart3, CalendarDays, CheckCircle2, MessageSquareText, Trophy, X } from "lucide-react"

import { EmptyState, SkeletonRows, formatDate } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { attendanceStatusLabels, gameTypeLabels, modeLabels, teamLabels } from "@/lib/labels"
import type { AttendanceStatus, AttendanceVote, Dashboard, GameResult, Member, MemberStatistics, StatisticsOverview, TeamName } from "@/types/api"

export function DashboardView({
  dashboard,
  loading,
  members,
  attendanceVotes,
  memberStats,
  statisticsOverview,
  currentMemberId,
  currentMemberVote,
  onOpenMembers,
  onOpenNotices,
  onOpenResults,
  onOpenStats,
  onOpenTeams,
  onVoteAttendance,
  voting,
  readOnly = false,
}: {
  dashboard: Dashboard | null
  loading: boolean
  members: Member[]
  attendanceVotes: AttendanceVote[]
  memberStats: MemberStatistics[]
  statisticsOverview: StatisticsOverview | null
  currentMemberId: number | null
  currentMemberVote?: AttendanceVote
  onOpenMembers: () => void
  onOpenNotices: () => void
  onOpenResults: () => void
  onOpenStats: () => void
  onOpenTeams: () => void
  onVoteAttendance: (memberId: number, status: AttendanceStatus) => void
  voting: boolean
  readOnly?: boolean
}) {
  const [openAttendanceStatus, setOpenAttendanceStatus] = useState<AttendanceStatus | null>(null)
  const [voteStatus, setVoteStatus] = useState<AttendanceStatus>("ATTENDING")
  const topAttendance = memberStats.toSorted((left, right) => right.playedCount - left.playedCount)[0] ?? null
  const topWinRate = memberStats
    .filter((stat) => stat.playedCount > 0)
    .toSorted((left, right) => right.winRate - left.winRate || right.playedCount - left.playedCount)[0] ?? null
  const finalResults = (dashboard?.recentResults ?? []).slice(0, 3)
  const recentResultDate = finalResults[0]?.gameDate ? formatDate(finalResults[0].gameDate) : null
  const canVote = Boolean(dashboard?.nextGameDay) && Boolean(currentMemberId) && !readOnly
  const regularMembers = members.filter((member) => member.status === "REGULAR")
  const voteByMemberId = new Map(attendanceVotes.flatMap((vote) => (vote.memberId ? [[vote.memberId, vote]] : [])))
  const attendanceRows = regularMembers.map((member) => {
    const vote = voteByMemberId.get(member.id)
    return {
      member,
      status: vote?.status ?? "UNDECIDED",
      voted: Boolean(vote),
    }
  })
  const attendanceCounts = {
    ATTENDING: attendanceRows.filter((row) => row.status === "ATTENDING").length,
    ABSENT: attendanceRows.filter((row) => row.status === "ABSENT").length,
    UNDECIDED: attendanceRows.filter((row) => row.status === "UNDECIDED").length,
  }
  const selectedAttendanceRows = openAttendanceStatus
    ? attendanceRows.filter((row) => row.status === openAttendanceStatus).toSorted((left, right) => left.member.name.localeCompare(right.member.name, "ko"))
    : []

  useEffect(() => {
    if (currentMemberVote?.status) {
      setVoteStatus(currentMemberVote.status)
    }
  }, [currentMemberVote?.status])

  return (
    <>
      {openAttendanceStatus ? (
        <AttendanceMemberModal
          rows={selectedAttendanceRows}
          status={openAttendanceStatus}
          onClose={() => setOpenAttendanceStatus(null)}
        />
      ) : null}

      <div className="space-y-4">
        <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden border-accent/35 bg-card shadow-sm shadow-slate-900/10">
          <CardContent className="p-0">
            <div className="border-b border-accent/30 bg-foreground p-5 text-white">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-accent/40 bg-accent/15 text-accent">
                      <CalendarDays className="h-5 w-5" />
                    </span>
                    <p className="text-sm font-black text-accent">다음 경기</p>
                  </div>
                  {loading ? (
                    <div className="mt-5 max-w-lg">
                      <SkeletonRows />
                    </div>
                  ) : dashboard?.nextGameDay ? (
                    <>
                      <h2 className="mt-4 text-4xl font-black leading-tight text-white">
                        {formatDate(dashboard.nextGameDay.gameDate)}
                      </h2>
                      <p className="mt-2 text-base font-semibold text-white/75">
                        {dashboard.nextGameDay.place} · {formatTimeRange(dashboard.nextGameDay.startTime, dashboard.nextGameDay.endTime)}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge className="border-accent/45 bg-accent/15 text-cyan-100">{modeLabels[dashboard.nextGameDay.mode]}</Badge>
                        <Badge className="border-white/20 bg-white/10 text-white/85">{gameTypeLabels[dashboard.nextGameDay.gameType]}</Badge>
                      </div>
                    </>
                  ) : (
                    <div className="mt-4">
                      <EmptyState title="예정된 경기가 없습니다." />
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <Button type="button" onClick={onOpenTeams} disabled={!dashboard?.nextGameDay}>
                    {readOnly ? "팀 보기" : "팀 구성"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className={`grid gap-3 bg-secondary/45 p-4 ${readOnly ? "" : "lg:grid-cols-[0.9fr_1.35fr]"}`}>
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <DashboardMetric
                    active={openAttendanceStatus === "ATTENDING"}
                    label="참석"
                    value={dashboard?.nextGameDay ? `${attendanceCounts.ATTENDING}명` : "-"}
                    onClick={() => setOpenAttendanceStatus((current) => (current === "ATTENDING" ? null : "ATTENDING"))}
                  />
                  <DashboardMetric
                    active={openAttendanceStatus === "ABSENT"}
                    label="불참"
                    value={dashboard?.nextGameDay ? `${attendanceCounts.ABSENT}명` : "-"}
                    onClick={() => setOpenAttendanceStatus((current) => (current === "ABSENT" ? null : "ABSENT"))}
                  />
                  <DashboardMetric
                    active={openAttendanceStatus === "UNDECIDED"}
                    label="미정"
                    value={dashboard?.nextGameDay ? `${attendanceCounts.UNDECIDED}명` : "-"}
                    onClick={() => setOpenAttendanceStatus((current) => (current === "UNDECIDED" ? null : "UNDECIDED"))}
                  />
                </div>
              </div>
              {!readOnly ? (
                <div className="rounded-md border border-border/80 bg-card/70 p-3 shadow-sm shadow-slate-900/5 lg:grid lg:grid-cols-[auto_minmax(270px,1fr)_auto] lg:items-center lg:gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between lg:contents">
                    <div className="flex items-center gap-2 lg:order-1 lg:whitespace-nowrap">
                      <p className="text-xs font-black text-accent">참석 투표</p>
                      {currentMemberVote ? (
                        <span className="rounded-md bg-secondary px-2 py-1 text-[11px] font-black text-muted-foreground">
                          {attendanceStatusLabels[currentMemberVote.status]}
                        </span>
                      ) : null}
                    </div>
                    <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:contents">
                      <Button
                        className="lg:order-3 lg:h-10"
                        type="button"
                        disabled={!canVote || voting}
                        onClick={() => {
                          if (currentMemberId) {
                            onVoteAttendance(currentMemberId, voteStatus)
                          }
                        }}
                      >
                        {voting ? "저장 중" : currentMemberVote ? "수정" : "투표"}
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 lg:order-2 lg:mt-0">
                    {(["ATTENDING", "ABSENT", "UNDECIDED"] as AttendanceStatus[]).map((status) => (
                      <button
                        key={status}
                        className={`h-10 rounded-md border px-2 text-xs font-black transition-colors ${
                          voteStatus === status
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                        }`}
                        type="button"
                        onClick={() => setVoteStatus(status)}
                        disabled={!dashboard?.nextGameDay || voting}
                      >
                        {attendanceStatusLabels[status]}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader className="pb-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <CardTitle className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-base leading-tight sm:text-lg">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                운영 요약
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={onOpenMembers}>
                회원
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2">
            <MiniLeader label="최다 참석" name={topAttendance?.memberName ?? "-"} value={topAttendance ? `${topAttendance.playedCount}회` : "-"} />
            <MiniLeader label="승률 리더" name={topWinRate?.memberName ?? "-"} value={topWinRate ? `${topWinRate.winRate}%` : "-"} />
            <MiniLeader
              label="승률 듀오"
              name={statisticsOverview?.bestDuo?.memberNames.join(" + ") ?? "-"}
              value={statisticsOverview?.bestDuo ? `${statisticsOverview.bestDuo.winRate}%` : "-"}
            />
          </CardContent>
        </Card>
      </section>

      <section className="grid items-start gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 shrink-0 text-accent" />
                최근 경기 결과
              </CardTitle>
              <div className="flex items-center justify-between gap-3 pl-7 sm:pl-0">
                {recentResultDate ? (
                  <span className="text-xs font-black text-muted-foreground sm:text-sm">({recentResultDate})</span>
                ) : (
                  <span />
                )}
                <Button className="h-8 px-2.5 text-xs sm:h-9 sm:px-3 sm:text-sm" type="button" variant="outline" size="sm" onClick={onOpenResults}>
                  결과
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <SkeletonRows />
            ) : finalResults.length ? (
              finalResults.map((result) => <DashboardResult key={result.id} result={result} />)
            ) : (
              <EmptyState title="기록된 결과가 없습니다." />
            )}
          </CardContent>
        </Card>

        <Card className="hidden md:block">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                통계 하이라이트
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={onOpenStats}>
                통계
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <InsightRow
              label="득점 듀오"
              value={statisticsOverview?.bestScoringDuo ? `${statisticsOverview.bestScoringDuo.averagePointsFor}점` : "-"}
              detail={statisticsOverview?.bestScoringDuo?.memberNames.join(" + ") ?? "기록 없음"}
            />
            <InsightRow
              label="철벽 듀오"
              value={statisticsOverview?.bestDefenseDuo ? `${statisticsOverview.bestDefenseDuo.averagePointsAgainst}점` : "-"}
              detail={statisticsOverview?.bestDefenseDuo?.memberNames.join(" + ") ?? "기록 없음"}
            />
            <InsightRow
              label="호흡 듀오"
              value={statisticsOverview?.mostPlayedDuo ? `${statisticsOverview.mostPlayedDuo.playedCount}회` : "-"}
              detail={statisticsOverview?.mostPlayedDuo?.memberNames.join(" + ") ?? "기록 없음"}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-accent" />
                게시판
              </CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={onOpenNotices}>
                게시판
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <SkeletonRows />
            ) : dashboard?.notices.length ? (
              dashboard.notices.slice(0, 4).map((notice) => (
                <article key={notice.id} className="rounded-md border border-border bg-background px-3 py-2">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="min-w-0 truncate text-sm font-black text-foreground">{notice.title}</h2>
                    {notice.pinned ? <Badge className="border-accent/40 bg-accent/10 text-accent">공지</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs font-black text-muted-foreground">{formatDashboardNoticeDate(notice.createdAt)}</p>
                  <p className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-muted-foreground">{notice.content}</p>
                </article>
              ))
            ) : (
              <EmptyState title="등록된 게시글이 없습니다." />
            )}
          </CardContent>
        </Card>
        </section>
      </div>
    </>
  )
}

function DashboardMetric({
  label,
  value,
  active = false,
  onClick,
}: {
  label: string
  value: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      className={`rounded-md border px-3 py-2 text-left text-foreground transition-colors ${
        active ? "border-accent bg-accent/10" : "border-border bg-background hover:border-accent/40 hover:bg-secondary/40"
      }`}
      type="button"
      onClick={onClick}
    >
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </button>
  )
}

function AttendanceMemberModal({
  rows,
  status,
  onClose,
}: {
  rows: { member: Member; status: AttendanceStatus; voted: boolean }[]
  status: AttendanceStatus
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4 py-6 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" type="button" aria-label="닫기" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-2xl shadow-slate-900/20">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-base font-black text-foreground">{attendanceStatusLabels[status]}</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{rows.length}명</p>
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            type="button"
            title="닫기"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {rows.length ? (
          <div className="grid max-h-[55vh] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
            {rows.map((row) => (
              <div key={row.member.id} className="flex min-w-0 items-center justify-between gap-2 rounded-md bg-secondary/45 px-2 py-2">
                <span className="min-w-0 truncate text-xs font-black text-foreground">{row.member.name}</span>
                {status === "UNDECIDED" && !row.voted ? (
                  <span className="shrink-0 text-[10px] font-black text-muted-foreground">미투표</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md bg-secondary/35 px-3 py-2 text-xs font-semibold text-muted-foreground">해당 인원이 없습니다.</p>
        )}
      </div>
    </div>
  )
}

function MiniLeader({ label, name, value }: { label: string; name: string; value: string }) {
  return (
    <div className="grid grid-cols-[76px_1fr_auto] items-center gap-3 rounded-md border border-border bg-secondary/25 px-3 py-2">
      <span className="text-xs font-black text-muted-foreground">{label}</span>
      <span className="min-w-0 truncate text-sm font-black text-foreground">{name}</span>
      <span className="text-sm font-black text-accent">{value}</span>
    </div>
  )
}

function InsightRow({ label, detail, value }: { label: string; detail: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black text-muted-foreground">{label}</p>
        <p className="text-lg font-black text-foreground">{value}</p>
      </div>
      <p className="mt-1 truncate text-sm font-semibold text-muted-foreground">{detail}</p>
    </div>
  )
}

function DashboardResult({ result }: { result: GameResult }) {
  const team1Won = result.outcome === "TEAM1_WIN"
  const team2Won = result.outcome === "TEAM2_WIN"

  return (
    <article className="rounded-md border border-border bg-background p-2.5 sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-3 sm:px-3 sm:py-2.5">
      <div className="space-y-1.5 sm:hidden">
        <DashboardMobileTeamScore teamName={result.team1Name} score={result.team1Score} winner={team1Won} />
        <DashboardMobileTeamScore teamName={result.team2Name} score={result.team2Score} winner={team2Won} />
      </div>

      <div className="hidden sm:block">
        <DashboardTeamPill teamName={result.team1Name} winner={team1Won} />
      </div>
      <div className="hidden text-center text-xl font-black tracking-normal text-foreground sm:block">
        {result.team1Score} : {result.team2Score}
      </div>
      <div className="hidden sm:block">
        <DashboardTeamPill teamName={result.team2Name} winner={team2Won} reverse />
      </div>
    </article>
  )
}

function DashboardMobileTeamScore({ teamName, score, winner }: { teamName: TeamName; score: number; winner: boolean }) {
  return (
    <div className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md px-2.5 py-2 ${winner ? "bg-accent/10" : "bg-secondary/45"}`}>
      <div className="flex min-w-0 items-center gap-2">
        <span className={`min-w-16 rounded-md border px-2.5 py-1.5 text-center text-xs font-black ${dashboardTeamTone(teamName)}`}>
          {teamLabels[teamName]}
        </span>
        {winner ? <Trophy className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" /> : null}
      </div>
      <span className="min-w-10 text-right text-2xl font-black leading-none text-foreground">{score}</span>
    </div>
  )
}

function DashboardTeamPill({ teamName, winner, reverse = false }: { teamName: TeamName; winner: boolean; reverse?: boolean }) {
  const trophy = winner ? <Trophy className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-500" /> : null

  return (
    <div className={`relative flex min-w-0 items-center justify-center gap-1.5 sm:justify-start ${reverse ? "sm:justify-end" : ""}`}>
      {reverse ? <span className="absolute left-0 sm:static">{trophy}</span> : null}
      <span className={`min-w-14 truncate rounded-md border px-2 py-1.5 text-center text-xs font-black sm:min-w-0 sm:px-2.5 sm:py-1 ${dashboardTeamTone(teamName)}`}>
        {teamLabels[teamName]}
      </span>
      {reverse ? null : <span className="absolute right-0 sm:static">{trophy}</span>}
    </div>
  )
}

function dashboardTeamTone(teamName: TeamName) {
  return {
    BLACK: "border-zinc-900 bg-zinc-950 text-white",
    WHITE: "border-zinc-300 bg-white text-zinc-900 shadow-sm",
    RED: "border-red-700 bg-red-600 text-white",
  }[teamName]
}

function formatTimeRange(start: string, end: string) {
  return `${start.slice(0, 5)}-${end.slice(0, 5)}`
}

function formatDashboardNoticeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}
