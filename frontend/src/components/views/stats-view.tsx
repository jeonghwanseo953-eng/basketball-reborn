import { useMemo, useState, type ComponentType } from "react"
import { ArrowLeft, BarChart3, Medal, RotateCcw, ShieldCheck, Target, Trophy, UsersRound } from "lucide-react"

import { EmptyState, FormModal, SkeletonRows } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMemberSynergies } from "@/lib/api"
import { teamLabels } from "@/lib/labels"
import type {
  CombinationStatistics,
  GameDay,
  Member,
  MemberStatistics,
  MemberSynergy,
  RecentResult,
  ResultOutcome,
  StatisticsFilter,
  StatisticsOverview,
  TeamName,
} from "@/types/api"

type StatSortKey = "winRate" | "playedCount" | "winCount" | "averagePointsFor" | "averagePointsAgainst"
type SynergySortKey = "playedCount" | "winRate" | "winCount" | "averagePointsFor" | "averagePointsAgainst"
type StatsTab = "overview" | "ranking" | "detail" | "combination"

const sortLabels: Record<StatSortKey, string> = {
  winRate: "승률",
  playedCount: "출전",
  winCount: "승수",
  averagePointsFor: "득점",
  averagePointsAgainst: "실점",
}

const statsTabs: Array<{ key: StatsTab; label: string; icon: ComponentType<{ className?: string }> }> = [
  { key: "overview", label: "개요", icon: BarChart3 },
  { key: "ranking", label: "개인 랭킹", icon: Medal },
  { key: "combination", label: "조합 통계", icon: UsersRound },
]

const outcomeLabels: Record<ResultOutcome, string> = {
  TEAM1_WIN: "승",
  TEAM2_WIN: "패",
  DRAW: "무",
}

export function StatsView({
  gameDays,
  members,
  memberStats,
  selectedMemberId,
  selectedMemberStat,
  combinationMemberIds,
  combinationStat,
  statisticsOverview,
  statisticsFilter,
  loading,
  onFilterChange,
  onSelectMember,
  onSelectCombination,
}: {
  gameDays: GameDay[]
  members: Member[]
  memberStats: MemberStatistics[]
  selectedMemberId: number
  selectedMemberStat: MemberStatistics | null
  combinationMemberIds: number[]
  combinationStat: CombinationStatistics | null
  statisticsOverview: StatisticsOverview | null
  statisticsFilter: StatisticsFilter
  loading: boolean
  onFilterChange: (filter: StatisticsFilter) => void
  onSelectMember: (memberId: number) => void
  onSelectCombination: (memberIds: number[]) => void
}) {
  const [activeTab, setActiveTab] = useState<StatsTab>("overview")
  const [query, setQuery] = useState("")
  const [sortKey, setSortKey] = useState<StatSortKey>("winRate")
  const [combinationQuery, setCombinationQuery] = useState("")

  const regularMembers = useMemo(() => members.filter((member) => member.status === "REGULAR"), [members])
  const visibleMemberIds = useMemo(
    () => new Set(members.filter((member) => member.status === "REGULAR" || member.status === "RESTING").map((member) => member.id)),
    [members],
  )
  const memberById = useMemo(() => new Map(members.map((member) => [member.id, member])), [members])
  const visibleMemberStats = useMemo(
    () => memberStats.filter((stat) => visibleMemberIds.has(stat.memberId)),
    [memberStats, visibleMemberIds],
  )
  const rankedStats = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return visibleMemberStats
      .filter((stat) => !normalizedQuery || stat.memberName.toLowerCase().includes(normalizedQuery))
      .toSorted((left, right) => {
        const primary = Number(right[sortKey]) - Number(left[sortKey])
        if (primary !== 0) {
          return primary
        }

        const played = right.playedCount - left.playedCount
        if (played !== 0) {
          return played
        }

        return left.memberName.localeCompare(right.memberName, "ko")
      })
  }, [query, sortKey, visibleMemberStats])

  const playedStats = useMemo(() => visibleMemberStats.filter((stat) => stat.playedCount > 0), [visibleMemberStats])
  const topWinRates = pickTopMany(playedStats, "winRate")
  const topPlayedStats = pickTopMany(playedStats, "playedCount")
  const topScorers = pickTopMany(playedStats, "averagePointsFor")
  const bestDefenses = playedStats
    .toSorted((left, right) => {
      const primary = left.averagePointsAgainst - right.averagePointsAgainst
      if (primary !== 0) {
        return primary
      }

      return right.playedCount - left.playedCount
    })
    .slice(0, 3)
  const selectedCombinationMembers = regularMembers.filter((member) => combinationMemberIds.includes(member.id))
  const filteredCombinationMembers = useMemo(() => {
    const normalizedQuery = combinationQuery.trim().toLowerCase()

    return regularMembers
      .filter((member) => !normalizedQuery || member.name.toLowerCase().includes(normalizedQuery))
      .toSorted((left, right) => left.name.localeCompare(right.name, "ko"))
  }, [combinationQuery, regularMembers])
  const monthOptions = useMemo(() => {
    const months = new Map<string, { year: number; month: number; label: string }>()

    gameDays
      .filter((gameDay) => gameDay.gameType === "REGULAR" && gameDay.status !== "HOLIDAY" && gameDay.status !== "CLOSED")
      .forEach((gameDay) => {
        const date = new Date(gameDay.gameDate)
        const year = date.getFullYear()
        const month = date.getMonth() + 1
        const key = `${year}-${String(month).padStart(2, "0")}`
        months.set(key, { year, month, label: `${year}년 ${month}월` })
      })

    return [...months.entries()]
      .toSorted(([left], [right]) => right.localeCompare(left))
      .map(([, value]) => value)
  }, [gameDays])
  const selectedMonthValue =
    statisticsFilter.scope === "MONTH" && statisticsFilter.year && statisticsFilter.month
      ? `${statisticsFilter.year}-${String(statisticsFilter.month).padStart(2, "0")}`
      : ""

  function toggleCombinationMember(memberId: number) {
    const next = combinationMemberIds.includes(memberId)
      ? combinationMemberIds.filter((id) => id !== memberId)
      : [...combinationMemberIds, memberId]
    onSelectCombination(next)
  }

  function selectMemberFromRanking(memberId: number) {
    onSelectMember(memberId)
    setActiveTab("detail")
  }

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-border bg-secondary/70 p-1.5 shadow-sm shadow-slate-900/5">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {statsTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`inline-flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-black transition-colors sm:px-3 sm:text-sm ${
                activeTab === key
                  ? "bg-card text-foreground shadow-sm shadow-slate-900/10"
                  : "text-muted-foreground hover:bg-card/70 hover:text-foreground"
              }`}
              type="button"
              onClick={() => setActiveTab(key)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-black text-foreground">통계 기간</p>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              기본값은 최근 정규전 10게임이며, 정규전 기록만 반영됩니다.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-[auto_180px]">
            <div className="flex rounded-md border border-border bg-secondary p-1">
              <button
                className={`h-9 rounded px-3 text-sm font-black transition-colors ${
                  statisticsFilter.scope === "RECENT" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                type="button"
                onClick={() => onFilterChange({ scope: "RECENT" })}
              >
                최근 10게임
              </button>
              <button
                className={`h-9 rounded px-3 text-sm font-black transition-colors ${
                  statisticsFilter.scope === "ALL" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}
                type="button"
                onClick={() => onFilterChange({ scope: "ALL" })}
              >
                전체
              </button>
            </div>
            <select
              className="h-11 rounded-md border border-input bg-secondary px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-ring"
              value={selectedMonthValue}
              onChange={(event) => {
                const [year, month] = event.target.value.split("-").map(Number)
                if (year && month) {
                  onFilterChange({ scope: "MONTH", year, month })
                }
              }}
            >
              <option value="" disabled>
                월별 선택
              </option>
              {monthOptions.map((option) => (
                <option key={`${option.year}-${option.month}`} value={`${option.year}-${String(option.month).padStart(2, "0")}`}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {activeTab === "overview" ? (
        <OverviewSection
          bestDefenses={bestDefenses}
          memberById={memberById}
          topPlayedStats={topPlayedStats}
          topScorers={topScorers}
          topWinRates={topWinRates}
          statisticsOverview={statisticsOverview}
          onSelectMember={selectMemberFromRanking}
        />
      ) : null}

      {activeTab === "ranking" ? (
        <RankingCard
          loading={loading}
          memberById={memberById}
          query={query}
          rankedStats={rankedStats}
          selectedMemberId={selectedMemberId}
          sortKey={sortKey}
          onQueryChange={setQuery}
          onSelectMember={selectMemberFromRanking}
          onSortChange={setSortKey}
        />
      ) : null}

      {activeTab === "detail" ? (
        <MemberDetailCard
          member={selectedMemberStat ? memberById.get(selectedMemberStat.memberId) ?? null : null}
          stat={selectedMemberStat}
          statisticsFilter={statisticsFilter}
          onBack={() => setActiveTab("ranking")}
        />
      ) : null}

      {activeTab === "combination" ? (
        <CombinationCard
          combinationMemberIds={combinationMemberIds}
          combinationStat={combinationStat}
          statisticsOverview={statisticsOverview}
          combinationQuery={combinationQuery}
          memberStats={memberStats}
          members={filteredCombinationMembers}
          selectedCombinationMembers={selectedCombinationMembers}
          onReset={() => onSelectCombination([])}
          onQueryChange={setCombinationQuery}
          onToggleMember={toggleCombinationMember}
        />
      ) : null}
    </section>
  )
}

function OverviewSection({
  bestDefenses,
  memberById,
  topPlayedStats,
  topScorers,
  topWinRates,
  statisticsOverview,
  onSelectMember,
}: {
  bestDefenses: MemberStatistics[]
  memberById: Map<number, Member>
  topPlayedStats: MemberStatistics[]
  topScorers: MemberStatistics[]
  topWinRates: MemberStatistics[]
  statisticsOverview: StatisticsOverview | null
  onSelectMember: (memberId: number) => void
}) {
  const leaders = [
    {
      icon: Medal,
      label: "최다 참석",
      stats: topPlayedStats,
      getValue: (stat: MemberStatistics) => `${stat.playedCount}회`,
      getDescription: () => "참석 횟수",
      tone: "border-sky-500/35 bg-sky-500/10 text-sky-700",
    },
    {
      icon: Trophy,
      label: "승률 리더",
      stats: topWinRates,
      getValue: (stat: MemberStatistics) => `${stat.winRate}%`,
      getDescription: (stat: MemberStatistics) => `${stat.playedCount}전 ${stat.winCount}승`,
      tone: "border-amber-500/35 bg-amber-500/10 text-amber-700",
    },
    {
      icon: Target,
      label: "공격 리더",
      stats: topScorers,
      getValue: (stat: MemberStatistics) => `${stat.averagePointsFor}`,
      getDescription: () => "팀 평균 득점",
      tone: "border-emerald-500/35 bg-emerald-500/10 text-emerald-700",
    },
    {
      icon: ShieldCheck,
      label: "수비 리더",
      stats: bestDefenses,
      getValue: (stat: MemberStatistics) => `${stat.averagePointsAgainst}`,
      getDescription: () => "팀 평균 실점",
      tone: "border-rose-500/35 bg-rose-500/10 text-rose-700",
    },
  ]
  return (
    <div className="space-y-4">
      <OverviewSectionTitle title="개인 리더" description="각 지표별 상위 3명을 보여줍니다." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {leaders.map(({ icon: Icon, label, stats, getValue, getDescription, tone }) => (
          <LeaderTopThreeCard
            key={label}
            icon={Icon}
            label={label}
            memberById={memberById}
            stats={stats}
            getDescription={getDescription}
            getValue={getValue}
            tone={tone}
            onSelectMember={onSelectMember}
          />
        ))}
      </div>

      <OverviewSectionTitle title="조합 리더" description="같이 뛴 2인 조합 기준입니다." />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CombinationLeaderCard
          icon={UsersRound}
          title="승률 듀오"
          description="승률"
          stat={statisticsOverview?.bestDuo ?? null}
          value={statisticsOverview?.bestDuo ? `${statisticsOverview.bestDuo.winRate}%` : "-"}
          meta={
            statisticsOverview?.bestDuo
              ? `${statisticsOverview.bestDuo.playedCount}전 ${statisticsOverview.bestDuo.winCount}승 ${statisticsOverview.bestDuo.lossCount}패`
              : "기록 없음"
          }
          tone="border-violet-500/35 bg-violet-500/10 text-violet-700"
        />
        <CombinationLeaderCard
          icon={Target}
          title="득점 듀오"
          description="득점"
          stat={statisticsOverview?.bestScoringDuo ?? null}
          value={statisticsOverview?.bestScoringDuo ? `${statisticsOverview.bestScoringDuo.averagePointsFor}점` : "-"}
          meta={
            statisticsOverview?.bestScoringDuo
              ? `${statisticsOverview.bestScoringDuo.playedCount}전 · ${statisticsOverview.bestScoringDuo.winCount}승`
              : "기록 없음"
          }
          tone="border-cyan-500/35 bg-cyan-500/10 text-cyan-700"
        />
        <CombinationLeaderCard
          icon={ShieldCheck}
          title="철벽 듀오"
          description="실점"
          stat={statisticsOverview?.bestDefenseDuo ?? null}
          value={statisticsOverview?.bestDefenseDuo ? `${statisticsOverview.bestDefenseDuo.averagePointsAgainst}점` : "-"}
          meta={
            statisticsOverview?.bestDefenseDuo
              ? `${statisticsOverview.bestDefenseDuo.playedCount}전 · ${statisticsOverview.bestDefenseDuo.winCount}승`
              : "기록 없음"
          }
          tone="border-emerald-500/35 bg-emerald-500/10 text-emerald-700"
        />
        <CombinationLeaderCard
          icon={Trophy}
          title="호흡 듀오"
          description="횟수"
          stat={statisticsOverview?.mostPlayedDuo ?? null}
          value={statisticsOverview?.mostPlayedDuo ? `${statisticsOverview.mostPlayedDuo.playedCount}회` : "-"}
          meta={
            statisticsOverview?.mostPlayedDuo
              ? `${statisticsOverview.mostPlayedDuo.winCount}승 ${statisticsOverview.mostPlayedDuo.lossCount}패 ${statisticsOverview.mostPlayedDuo.drawCount}무`
              : "기록 없음"
          }
          tone="border-amber-500/35 bg-amber-500/10 text-amber-700"
        />
      </div>
    </div>
  )
}

function LeaderTopThreeCard({
  icon: Icon,
  label,
  memberById,
  stats,
  getDescription,
  getValue,
  tone,
  onSelectMember,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  memberById: Map<number, Member>
  stats: MemberStatistics[]
  getDescription: (stat: MemberStatistics) => string
  getValue: (stat: MemberStatistics) => string
  tone: string
  onSelectMember: (memberId: number) => void
}) {
  const [first, ...rest] = stats
  const firstMember = first ? memberById.get(first.memberId) ?? null : null

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <button
          className="w-full border-b border-border bg-secondary/25 p-4 text-left transition-colors hover:bg-secondary/45 disabled:cursor-default disabled:hover:bg-secondary/25"
          type="button"
          disabled={!first}
          onClick={() => first && onSelectMember(first.memberId)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className={`inline-flex h-11 w-11 items-center justify-center rounded-md border ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            {first ? <StatProfileAvatar member={firstMember} name={first.memberName} size="md" /> : null}
          </div>
          <p className="mt-4 text-xs font-black text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-black text-foreground">{first ? first.memberName : "-"}</p>
          <div className="mt-4 flex items-end justify-between gap-3 rounded-md border border-border bg-background px-3 py-2">
            <p className="text-sm font-semibold text-muted-foreground">{first ? getDescription(first) : "기록 없음"}</p>
            <p className="text-3xl font-black text-foreground">{first ? getValue(first) : "-"}</p>
          </div>
        </button>

        {rest.length ? (
          <div className="space-y-2 p-3">
            {rest.map((stat, index) => (
              <button
                key={stat.memberId}
                className="grid w-full grid-cols-[36px_1fr_auto] items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-secondary"
                type="button"
                onClick={() => onSelectMember(stat.memberId)}
              >
                <span className="inline-flex h-7 items-center justify-center rounded-md bg-secondary text-xs font-black text-muted-foreground">
                  {index + 2}위
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <StatProfileAvatar member={memberById.get(stat.memberId) ?? null} name={stat.memberName} size="xs" />
                  <span className="min-w-0 truncate font-black text-foreground">{stat.memberName}</span>
                </span>
                <span className="font-black text-muted-foreground">{getValue(stat)}</span>
              </button>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function CombinationLeaderCard({
  icon: Icon,
  title,
  description,
  stat,
  value,
  meta,
  tone,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description: string
  stat: CombinationStatistics | null
  value: string
  meta: string
  tone: string
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="border-b border-border bg-secondary/25 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border ${tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <Badge className="border-border bg-background text-muted-foreground">{description}</Badge>
          </div>
          <p className="mt-4 text-xs font-black text-muted-foreground">{title}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {stat ? (
              stat.memberNames.map((name) => (
                <span
                  key={name}
                  className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-sm font-black text-foreground"
                >
                  {name}
                </span>
              ))
            ) : (
              <span className="text-xl font-black text-foreground">-</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-3 p-4">
          <div>
            <p className="text-xs font-black text-muted-foreground">기록</p>
            <p className="mt-1 text-sm font-semibold text-muted-foreground">{meta}</p>
          </div>
          <p className="text-3xl font-black text-foreground">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function OverviewSectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-end justify-between gap-3 pt-1">
      <div>
        <h3 className="text-base font-black text-foreground">{title}</h3>
        <p className="mt-1 text-sm font-semibold text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

function RankingCard({
  loading,
  memberById,
  query,
  rankedStats,
  selectedMemberId,
  sortKey,
  onQueryChange,
  onSelectMember,
  onSortChange,
}: {
  loading: boolean
  memberById: Map<number, Member>
  query: string
  rankedStats: MemberStatistics[]
  selectedMemberId: number
  sortKey: StatSortKey
  onQueryChange: (value: string) => void
  onSelectMember: (memberId: number) => void
  onSortChange: (key: StatSortKey) => void
}) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5 text-accent" />
            개인 랭킹
          </CardTitle>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] lg:w-[520px]">
            <input
              className="h-10 rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="회원 검색"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
            />
            <div className="flex rounded-md border border-border bg-secondary p-1">
              {(Object.keys(sortLabels) as StatSortKey[]).map((key) => (
                <button
                  key={key}
                  className={`h-8 rounded px-2 text-xs font-black transition-colors ${
                    sortKey === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => onSortChange(key)}
                >
                  {sortLabels[key]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <SkeletonRows />
        ) : rankedStats.length ? (
          <>
            <div className="grid gap-2 md:hidden">
              {rankedStats.map((stat, index) => (
                <button
                  key={stat.memberId}
                  className={`rounded-md border p-3 text-left transition-colors ${
                    selectedMemberId === stat.memberId
                      ? "border-accent bg-accent/10"
                      : "border-border bg-background hover:bg-secondary/40"
                  }`}
                  type="button"
                  onClick={() => onSelectMember(stat.memberId)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-xs font-black ${rankingBadgeTone(index)}`}>
                        {index + 1}
                      </span>
                      <StatProfileAvatar member={memberById.get(stat.memberId) ?? null} name={stat.memberName} />
                      <span className="min-w-0">
                        <span className="block truncate text-base font-black text-foreground">{stat.memberName}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-muted-foreground">
                          {stat.playedCount}전 {stat.winCount}승 {stat.lossCount}패 {stat.drawCount}무
                        </span>
                      </span>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="block text-2xl font-black leading-none text-accent">{stat.winRate}%</span>
                      <span className="mt-1 block text-[11px] font-black text-muted-foreground">승률</span>
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <RankingMetric label="출전" value={stat.playedCount} />
                    <RankingMetric label="평균 득점" value={stat.averagePointsFor} />
                    <RankingMetric label="평균 실점" value={stat.averagePointsAgainst} />
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-md border border-border md:block">
              <table className="min-w-[720px] w-full table-fixed text-sm">
                <thead className="bg-secondary/80 text-xs font-black text-muted-foreground">
                  <tr>
                    <th className="w-14 px-3 py-2 text-center">순위</th>
                    <th className="px-3 py-2 text-left">회원</th>
                    <th className="w-20 px-3 py-2 text-right">승률</th>
                    <th className="w-20 px-3 py-2 text-right">출전</th>
                    <th className="w-28 px-3 py-2 text-right">승/패/무</th>
                    <th className="w-24 px-3 py-2 text-right">팀 평균 득점</th>
                    <th className="w-24 px-3 py-2 text-right">팀 평균 실점</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedStats.map((stat, index) => (
                    <tr
                      key={stat.memberId}
                      className={`cursor-pointer border-t border-border transition-colors hover:bg-secondary/50 ${
                        selectedMemberId === stat.memberId ? "bg-accent/10" : "bg-background"
                      }`}
                      onClick={() => onSelectMember(stat.memberId)}
                    >
                      <td className="px-3 py-3 text-center font-black text-muted-foreground">{index + 1}</td>
                      <td className="px-3 py-3">
                        <span className="flex min-w-0 items-center gap-2 font-black text-foreground">
                          <StatProfileAvatar member={memberById.get(stat.memberId) ?? null} name={stat.memberName} size="sm" />
                          <span className="min-w-0 truncate">{stat.memberName}</span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right font-black text-accent">{stat.winRate}%</td>
                      <td className="px-3 py-3 text-right font-semibold">{stat.playedCount}</td>
                      <td className="px-3 py-3 text-right font-semibold">
                        {stat.winCount}/{stat.lossCount}/{stat.drawCount}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">{stat.averagePointsFor}</td>
                      <td className="px-3 py-3 text-right font-semibold">{stat.averagePointsAgainst}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState title="조건에 맞는 통계가 없습니다." />
        )}
      </CardContent>
    </Card>
  )
}

function RankingMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="rounded-md border border-border bg-secondary/35 px-2 py-2 text-center">
      <span className="block text-[11px] font-black text-muted-foreground">{label}</span>
      <span className="mt-1 block text-base font-black text-foreground">{value}</span>
    </span>
  )
}

function rankingBadgeTone(index: number) {
  if (index === 0) {
    return "border-amber-500/50 bg-amber-400 text-slate-950"
  }

  if (index === 1) {
    return "border-slate-400/60 bg-slate-200 text-slate-800"
  }

  if (index === 2) {
    return "border-orange-500/45 bg-orange-500/15 text-orange-700"
  }

  return "border-border bg-secondary text-muted-foreground"
}

function StatProfileAvatar({
  member,
  name,
  size = "md",
}: {
  member: Member | null
  name: string
  size?: "xs" | "sm" | "md" | "lg"
}) {
  const sizeClass = {
    xs: "h-7 w-7 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-14 w-14 text-2xl",
  }[size]
  const imageUrl = member?.profileImageUrl

  if (imageUrl) {
    return (
      <img
        className={`${sizeClass} shrink-0 rounded-md border border-border object-cover`}
        src={imageUrl}
        alt={`${name} 프로필`}
      />
    )
  }

  return (
    <span className={`${sizeClass} flex shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 font-black text-accent`}>
      {name.slice(0, 1)}
    </span>
  )
}

function MemberDetailCard({
  member,
  stat,
  statisticsFilter,
  onBack,
}: {
  member: Member | null
  stat: MemberStatistics | null
  statisticsFilter: StatisticsFilter
  onBack: () => void
}) {
  const [synergyOpen, setSynergyOpen] = useState(false)
  const [synergies, setSynergies] = useState<MemberSynergy[]>([])
  const [synergyLoading, setSynergyLoading] = useState(false)
  const [synergySortKey, setSynergySortKey] = useState<SynergySortKey>("winRate")
  const sortedSynergies = useMemo(
    () =>
      synergies.toSorted((left, right) => {
        const primary = Number(right[synergySortKey]) - Number(left[synergySortKey])
        if (primary !== 0) {
          return primary
        }

        const played = right.playedCount - left.playedCount
        if (played !== 0) {
          return played
        }

        return left.memberName.localeCompare(right.memberName, "ko")
      }),
    [synergies, synergySortKey],
  )

  async function toggleSynergies() {
    if (!stat) {
      return
    }

    if (synergyOpen) {
      return
    }

    setSynergyOpen(true)
    setSynergyLoading(true)
    try {
      setSynergies(await getMemberSynergies(stat.memberId, statisticsFilter))
    } finally {
      setSynergyLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <Button className="w-fit" type="button" variant="ghost" size="sm" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" />
        뒤로가기
      </Button>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-accent" />
              개인 상세
            </CardTitle>
            {stat ? (
              <Button className="w-fit" type="button" size="sm" onClick={() => void toggleSynergies()}>
                <UsersRound className="h-4 w-4" />
                시너지 보기
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {stat ? (
            <div>
              <div className="flex flex-col gap-4 border-b border-border bg-background px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div className="flex items-center gap-4">
                  <StatProfileAvatar member={member} name={stat.memberName} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-3xl font-black leading-tight text-foreground">{stat.memberName}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className="border-border bg-secondary text-muted-foreground">
                        {stat.winCount}승 {stat.lossCount}패 {stat.drawCount}무
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:w-64">
                  <HighlightMetric label="승률" value={`${stat.winRate}%`} accent />
                  <HighlightMetric
                    label="득실 차"
                    value={formatSignedNumber(Number(stat.averagePointsFor) - Number(stat.averagePointsAgainst))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 px-4 py-4 sm:px-5 lg:grid-cols-4">
                <StatTile icon={Trophy} label="출전" value={`${stat.playedCount}회`} />
                <StatTile icon={Medal} label="승/패/무" value={`${stat.winCount}/${stat.lossCount}/${stat.drawCount}`} />
                <StatTile icon={Target} label="팀 평균 득점" value={stat.averagePointsFor} accent />
                <StatTile icon={ShieldCheck} label="팀 평균 실점" value={stat.averagePointsAgainst} />
              </div>

              <section className="space-y-3 border-t border-border px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-black text-foreground">최근 기록</h3>
                  <span className="text-xs font-semibold text-muted-foreground">{stat.recentResults.length}경기</span>
                </div>
                {stat.recentResults.length ? (
                  <div className="space-y-3">
                    {groupRecentResultsByDate(stat.recentResults).map((group) => (
                      <div key={group.date} className="overflow-hidden rounded-md border border-border bg-background">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/25 px-3 py-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-foreground">{formatRecentGameDate(group.date)}</p>
                            <div className="flex flex-wrap items-center gap-1.5">
                              {getRecentGroupTeams(group.results).map((teamName) => (
                                <TeamPill key={teamName} teamName={teamName} compact />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-muted-foreground">{group.results.length}경기</span>
                        </div>
                        <div className="grid gap-2 p-2 lg:grid-cols-2">
                          {group.results.map((result) => (
                            <RecentResultRow key={result.gameResultId} result={result} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="최근 기록이 없습니다." />
                )}
              </section>

            </div>
          ) : (
            <div className="p-5">
              <EmptyState title="회원을 선택하세요." />
            </div>
          )}
        </CardContent>
      </Card>

      {synergyOpen && stat ? (
        <FormModal
          title={
            <>
              <UsersRound className="h-5 w-5 text-accent" />
              {stat.memberName} 시너지
            </>
          }
          size="wide"
          onClose={() => setSynergyOpen(false)}
        >
          <SynergyTable
            loading={synergyLoading}
            sortKey={synergySortKey}
            synergies={sortedSynergies}
            onSortChange={setSynergySortKey}
          />
        </FormModal>
      ) : null}
    </div>
  )
}

function CombinationCard({
  combinationMemberIds,
  combinationStat,
  combinationQuery,
  memberStats,
  members,
  selectedCombinationMembers,
  onReset,
  onQueryChange,
  onToggleMember,
}: {
  combinationMemberIds: number[]
  combinationStat: CombinationStatistics | null
  combinationQuery: string
  memberStats: MemberStatistics[]
  members: Member[]
  selectedCombinationMembers: Member[]
  onReset: () => void
  onQueryChange: (query: string) => void
  onToggleMember: (memberId: number) => void
}) {
  const ready = selectedCombinationMembers.length >= 2
  const verdict = combinationStat ? getCombinationVerdict(combinationStat) : null
  const selectedMemberStats = selectedCombinationMembers
    .map((member) => memberStats.find((stat) => stat.memberId === member.id))
    .filter((stat): stat is MemberStatistics => Boolean(stat))

  return (
    <div className="grid gap-3 lg:grid-cols-[360px_1fr]">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/25">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-accent" />
              조합 선택
            </CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={onReset} disabled={!selectedCombinationMembers.length}>
              <RotateCcw className="h-4 w-4" />
              초기화
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <input
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm font-semibold outline-none transition focus:ring-2 focus:ring-ring"
            placeholder="회원 검색"
            value={combinationQuery}
            onChange={(event) => onQueryChange(event.target.value)}
          />

          {selectedCombinationMembers.length ? (
            <div className="rounded-md border border-accent/25 bg-accent/5 p-2">
              <p className="mb-2 text-xs font-black text-accent">선택한 조합</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedCombinationMembers.map((member) => (
                  <button
                    key={member.id}
                    className="inline-flex h-8 items-center rounded-md border border-accent/35 bg-background px-2 text-sm font-black text-accent transition-colors hover:bg-accent/10"
                    type="button"
                    onClick={() => onToggleMember(member.id)}
                  >
                    {member.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="rounded-md border border-dashed border-border bg-secondary/25 p-3 text-sm font-semibold text-muted-foreground">
              회원을 2명 이상 선택하세요.
            </p>
          )}

          <div className="grid max-h-[430px] grid-cols-2 gap-2 overflow-y-auto pr-1">
            {members.map((member) => {
              const selected = combinationMemberIds.includes(member.id)

              return (
                <button
                  key={member.id}
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition-colors ${
                    selected
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                  type="button"
                  onClick={() => onToggleMember(member.id)}
                >
                  {member.name}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border bg-secondary/25">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-accent" />
            조합 결과
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-4">
          {ready && combinationStat ? (
            <>
              <div className="flex flex-col gap-3 rounded-md border border-border bg-background p-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black text-muted-foreground">선택 조합</p>
                  <h3 className="mt-2 text-2xl font-black text-foreground">
                    {selectedCombinationMembers.map((member) => member.name).join(" + ")}
                  </h3>
                  {verdict ? <Badge className={`mt-3 ${verdict.tone}`}>{verdict.label}</Badge> : null}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs font-black text-muted-foreground">승률</p>
                  <p className="mt-1 text-4xl font-black text-accent">{combinationStat.winRate}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                <StatTile icon={Trophy} label="같이 뛴 경기" value={`${combinationStat.playedCount}회`} />
                <StatTile icon={Medal} label="승/패/무" value={`${combinationStat.winCount}/${combinationStat.lossCount}/${combinationStat.drawCount}`} />
                <StatTile icon={Target} label="팀 평균 득점" value={`${combinationStat.averagePointsFor}점`} accent />
                <StatTile icon={ShieldCheck} label="팀 평균 실점" value={`${combinationStat.averagePointsAgainst}점`} />
              </div>

              <CombinationMemberComparison stats={selectedMemberStats} />
              <CombinationHistory results={combinationStat.recentResults} />
            </>
          ) : (
            <EmptyState title="조합을 선택하면 결과가 표시됩니다." />
          )}
        </CardContent>
      </Card>

    </div>
  )
}

function CombinationMemberComparison({ stats }: { stats: MemberStatistics[] }) {
  if (!stats.length) {
    return null
  }

  return (
    <section className="rounded-md border border-border bg-background">
      <div className="border-b border-border bg-secondary/25 px-3 py-2">
        <h3 className="text-sm font-black text-foreground">선택 회원 비교</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[620px] w-full table-fixed text-sm">
          <thead className="text-xs font-black text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">회원</th>
              <th className="w-20 px-3 py-2 text-right">출전</th>
              <th className="w-20 px-3 py-2 text-right">승률</th>
              <th className="w-24 px-3 py-2 text-right">팀 득점</th>
              <th className="w-24 px-3 py-2 text-right">팀 실점</th>
              <th className="w-24 px-3 py-2 text-right">승/패/무</th>
            </tr>
          </thead>
          <tbody>
            {stats.map((stat) => (
              <tr key={stat.memberId} className="border-t border-border">
                <td className="px-3 py-3 font-black text-foreground">{stat.memberName}</td>
                <td className="px-3 py-3 text-right font-semibold">{stat.playedCount}</td>
                <td className="px-3 py-3 text-right font-black text-accent">{stat.winRate}%</td>
                <td className="px-3 py-3 text-right font-semibold">{stat.averagePointsFor}점</td>
                <td className="px-3 py-3 text-right font-semibold">{stat.averagePointsAgainst}점</td>
                <td className="px-3 py-3 text-right font-semibold">
                  {stat.winCount}/{stat.lossCount}/{stat.drawCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CombinationHistory({ results }: { results: RecentResult[] }) {
  return (
    <section className="rounded-md border border-border bg-background">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/25 px-3 py-2">
        <h3 className="text-sm font-black text-foreground">같이 뛴 기록</h3>
        <span className="text-xs font-semibold text-muted-foreground">{results.length}경기</span>
      </div>
      {results.length ? (
        <div className="divide-y divide-border">
          {results.map((result) => (
            <div
              key={result.gameResultId}
              className="grid grid-cols-[96px_1fr_auto] items-center gap-3 px-3 py-2 text-sm"
            >
              <span className="font-bold text-muted-foreground">{formatShortGameDate(result.gameDate)}</span>
              <div className="flex min-w-0 items-center gap-2">
                <TeamPill teamName={result.teamName} compact />
                <span className="text-xs font-black text-muted-foreground">vs</span>
                <TeamPill teamName={result.opponentTeamName} compact />
              </div>
              <div className="flex items-center gap-2">
                <span className="tabular-nums text-base font-black text-foreground">
                  {result.pointsFor}:{result.pointsAgainst}
                </span>
                <OutcomeBadge outcome={result.outcome} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3">
          <EmptyState title="같이 뛴 기록이 없습니다." />
        </div>
      )}
    </section>
  )
}

function getCombinationVerdict(stat: CombinationStatistics) {
  if (stat.playedCount < 2) {
    return {
      label: "표본 적음",
      tone: "border-slate-400/40 bg-slate-500/10 text-slate-700",
    }
  }

  if (stat.winRate >= 70 && stat.averagePointsAgainst <= 38) {
    return {
      label: "안정형 조합",
      tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
    }
  }

  if (stat.averagePointsFor >= 40) {
    return {
      label: "공격형 조합",
      tone: "border-cyan-500/40 bg-cyan-500/10 text-cyan-700",
    }
  }

  if (stat.averagePointsAgainst <= 37) {
    return {
      label: "수비형 조합",
      tone: "border-blue-500/40 bg-blue-500/10 text-blue-700",
    }
  }

  if (stat.winRate >= 60) {
    return {
      label: "승률 우수",
      tone: "border-violet-500/40 bg-violet-500/10 text-violet-700",
    }
  }

  return null
}

function SynergyTable({
  loading,
  sortKey,
  synergies,
  onSortChange,
}: {
  loading: boolean
  sortKey: SynergySortKey
  synergies: MemberSynergy[]
  onSortChange: (key: SynergySortKey) => void
}) {
  const columns: Array<{ key: SynergySortKey; label: string; className?: string }> = [
    { key: "playedCount", label: "같이 뛴 경기", className: "w-28" },
    { key: "winRate", label: "승률", className: "w-20" },
    { key: "winCount", label: "승수", className: "w-20" },
    { key: "averagePointsFor", label: "팀 평균 득점", className: "w-24" },
    { key: "averagePointsAgainst", label: "팀 평균 실점", className: "w-24" },
  ]

  return (
    <section className="space-y-3 rounded-md border border-border bg-secondary/20 p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-black text-foreground">시너지 표</h3>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">같은 팀으로 뛴 2인 조합 기준입니다.</p>
        </div>
        <Badge className="w-fit border-border bg-background text-muted-foreground">{synergies.length}명</Badge>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : synergies.length ? (
        <div className="overflow-x-auto rounded-md border border-border bg-background">
          <table className="min-w-[760px] w-full table-fixed text-sm">
            <thead className="bg-secondary/80 text-xs font-black text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">회원</th>
                {columns.map((column) => (
                  <th key={column.key} className={`${column.className ?? ""} px-3 py-2 text-right`}>
                    <button
                      className={`inline-flex items-center justify-end gap-1 font-black transition-colors ${
                        sortKey === column.key ? "text-foreground" : "hover:text-foreground"
                      }`}
                      type="button"
                      onClick={() => onSortChange(column.key)}
                    >
                      {column.label}
                      {sortKey === column.key ? "↓" : ""}
                    </button>
                  </th>
                ))}
                <th className="w-28 px-3 py-2 text-right">승/패/무</th>
              </tr>
            </thead>
            <tbody>
              {synergies.map((synergy) => (
                <tr key={synergy.memberId} className="border-t border-border">
                  <td className="px-3 py-3 font-black text-foreground">{synergy.memberName}</td>
                  <td className="px-3 py-3 text-right font-semibold">{synergy.playedCount}</td>
                  <td className="px-3 py-3 text-right font-black text-accent">{synergy.winRate}%</td>
                  <td className="px-3 py-3 text-right font-semibold">{synergy.winCount}</td>
                  <td className="px-3 py-3 text-right font-semibold">{synergy.averagePointsFor}</td>
                  <td className="px-3 py-3 text-right font-semibold">{synergy.averagePointsAgainst}</td>
                  <td className="px-3 py-3 text-right font-semibold">
                    {synergy.winCount}/{synergy.lossCount}/{synergy.drawCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="같이 뛴 조합 기록이 없습니다." />
      )}
    </section>
  )
}

function RecentResultRow({ result }: { result: RecentResult }) {
  const outcomeTone = {
    TEAM1_WIN: "border-l-emerald-500",
    TEAM2_WIN: "border-l-red-500",
    DRAW: "border-l-slate-400",
  }[result.outcome]

  return (
    <article className={`rounded-md border border-l-4 border-border bg-secondary/15 px-3 py-2.5 ${outcomeTone}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <TeamPill teamName={result.teamName} />
          <span className="text-xs font-black text-muted-foreground">vs</span>
          <TeamPill teamName={result.opponentTeamName} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="tabular-nums text-2xl font-black leading-none text-foreground">
            {result.pointsFor}:{result.pointsAgainst}
          </p>
          <OutcomeBadge outcome={result.outcome} />
        </div>
      </div>
    </article>
  )
}

function groupRecentResultsByDate(results: RecentResult[]) {
  const groups = new Map<string, RecentResult[]>()

  results.forEach((result) => {
    const current = groups.get(result.gameDate) ?? []
    current.push(result)
    groups.set(result.gameDate, current)
  })

  return [...groups.entries()].map(([date, groupResults]) => ({
    date,
    results: groupResults,
  }))
}

function getRecentGroupTeams(results: RecentResult[]) {
  return [...new Set(results.map((result) => result.teamName))]
}

function formatRecentGameDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value))
}

function formatShortGameDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value))
}

function formatSignedNumber(value: number) {
  const rounded = Math.round(value * 10) / 10
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

function HighlightMetric({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-md border px-3 py-2 ${accent ? "border-accent/35 bg-accent/10" : "border-border bg-secondary/35"}`}>
      <p className={`text-xs font-semibold ${accent ? "text-accent" : "text-muted-foreground"}`}>{label}</p>
      <p className={`mt-1 text-xl font-black ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
    </div>
  )
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent = false,
}: {
  icon?: ComponentType<{ className?: string }>
  label: string
  value: string | number
  accent?: boolean
}) {
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        {Icon ? (
          <span className={`flex h-7 w-7 items-center justify-center rounded-md ${accent ? "bg-accent/10 text-accent" : "bg-background text-muted-foreground"}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className={`mt-2 text-xl font-black ${accent ? "text-accent" : "text-foreground"}`}>{value}</p>
    </div>
  )
}

function TeamPill({ teamName, compact = false }: { teamName: TeamName; compact?: boolean }) {
  const tone = {
    BLACK: "bg-neutral-950 text-white border-neutral-950",
    WHITE: "bg-white text-slate-900 border-slate-300",
    RED: "bg-red-700 text-white border-red-700",
  }[teamName]

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border text-xs font-black ${
        compact ? "h-6 px-2" : "h-7 px-2"
      } ${tone}`}
    >
      {teamLabels[teamName]}
    </span>
  )
}

function OutcomeBadge({ outcome }: { outcome: ResultOutcome }) {
  const tone = {
    TEAM1_WIN: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700",
    TEAM2_WIN: "border-red-500/35 bg-red-500/10 text-red-700",
    DRAW: "border-slate-400/40 bg-slate-500/10 text-slate-700",
  }[outcome]

  return <Badge className={tone}>{outcomeLabels[outcome]}</Badge>
}

function pickTopMany(stats: MemberStatistics[], key: StatSortKey) {
  return stats.toSorted((left, right) => {
    const primary = Number(right[key]) - Number(left[key])
    if (primary !== 0) {
      return primary
    }

    return right.playedCount - left.playedCount
  }).slice(0, 3)
}
