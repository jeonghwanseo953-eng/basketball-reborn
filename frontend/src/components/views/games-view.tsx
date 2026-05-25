import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ClipboardList,
  Crown,
  Clock,
  MapPin,
  Pencil,
  Plus,
  Search,
  StickyNote,
  Trophy,
  UsersRound,
  X,
} from "lucide-react"

import { EmptyState, SelectInput, SkeletonRows, TextArea, TextInput } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getGameResults } from "@/lib/api"
import { gameStatusLabels, gameTypeLabels, modeLabels, teamLabels } from "@/lib/labels"
import type { GameDay, GameDayMode, GameDayRequest, GameDayStatus, GameDayType, GameResult, TeamName } from "@/types/api"

type GameDaySortKey = "gameDate" | "mode" | "gameType" | "status" | "place"
type SortDirection = "asc" | "desc"
type StatusFilter = "ALL" | "SCHEDULED" | "COMPLETED" | "HOLIDAY"


const editableStatusLabels: Record<Exclude<StatusFilter, "ALL">, string> = {
  SCHEDULED: "예정",
  COMPLETED: "완료",
  HOLIDAY: "휴무",
}

export function GamesView({
  gameDays,
  currentGameDayId,
  currentResults,
  form,
  editingGameDayId,
  loading,
  saving,
  onChange,
  onSubmit,
  onEdit,
  onCancelEdit,
  onOpenTeams,
  onOpenResults,
  readOnly = false,
}: {
  gameDays: GameDay[]
  currentGameDayId: number
  currentResults: GameResult[]
  form: GameDayRequest
  editingGameDayId: number | null
  loading: boolean
  saving: boolean
  onChange: (value: GameDayRequest) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEdit: (gameDay: GameDay) => void
  onCancelEdit: () => void
  onOpenTeams: (gameDayId: number) => void
  onOpenResults: (gameDayId: number) => void
  readOnly?: boolean
}) {
  const editing = editingGameDayId !== null
  const activeGameDays = useMemo(() => gameDays.filter((gameDay) => gameDay.status !== "CLOSED"), [gameDays])
  const [formOpen, setFormOpen] = useState(false)
  const [selectedGameDay, setSelectedGameDay] = useState<GameDay | null>(null)
  const [detailResults, setDetailResults] = useState<GameResult[]>([])
  const [detailResultsLoading, setDetailResultsLoading] = useState(false)
  const [wasSaving, setWasSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL")
  const [modeFilter, setModeFilter] = useState<GameDayMode | "ALL">("ALL")
  const [typeFilter, setTypeFilter] = useState<GameDayType | "ALL">("ALL")
  const [sortKey, setSortKey] = useState<GameDaySortKey>("gameDate")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const counts = useMemo(() => {
    return activeGameDays.reduce(
      (acc, gameDay) => {
        acc.total += 1
        if (gameDay.status === "SCHEDULED" || gameDay.status === "COMPLETED" || gameDay.status === "HOLIDAY") {
          acc[gameDay.status] += 1
        }
        return acc
      },
      { total: 0, SCHEDULED: 0, COMPLETED: 0, HOLIDAY: 0 } as Record<StatusFilter | "total", number>,
    )
  }, [activeGameDays])

  const displayedGameDays = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const filtered = activeGameDays.filter((gameDay) => {
      const matchesStatus = statusFilter === "ALL" || gameDay.status === statusFilter
      const matchesMode = modeFilter === "ALL" || gameDay.mode === modeFilter
      const matchesType = typeFilter === "ALL" || getGameType(gameDay) === typeFilter
      const searchableText = [gameDay.gameDate, gameDay.place, gameDay.memo].filter(Boolean).join(" ").toLowerCase()
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery)

      return matchesStatus && matchesMode && matchesType && matchesQuery
    })

    return [...filtered].sort((left, right) => compareGameDays(left, right, sortKey, sortDirection))
  }, [activeGameDays, query, statusFilter, modeFilter, typeFilter, sortDirection, sortKey])

  const groupedGameDays = useMemo(() => groupGameDaysByMonth(displayedGameDays), [displayedGameDays])

  useEffect(() => {
    if (editing) {
      setFormOpen(true)
    }
  }, [editing])

  useEffect(() => {
    if (wasSaving && !saving && !editing) {
      setFormOpen(false)
    }
    setWasSaving(saving)
  }, [editing, saving, wasSaving])

  function openCreateForm() {
    if (readOnly) return
    onCancelEdit()
    setSelectedGameDay(null)
    setFormOpen(true)
  }

  function closeForm() {
    onCancelEdit()
    setFormOpen(false)
  }

  async function openGameDayDetail(gameDay: GameDay) {
    setSelectedGameDay(gameDay)
    setDetailResults([])

    if (!canRecordResults(gameDay)) {
      return
    }

    setDetailResultsLoading(true)
    try {
      setDetailResults(await getGameResults(gameDay.id))
    } catch {
      setDetailResults([])
    } finally {
      setDetailResultsLoading(false)
    }
  }

  function editGameDay(gameDay: GameDay) {
    if (readOnly) return
    setSelectedGameDay(null)
    onEdit(gameDay)
    setFormOpen(true)
  }

  function openTeamsFromDetail(gameDay: GameDay) {
    onOpenTeams(gameDay.id)
  }

  function openResultsFromDetail(gameDay: GameDay) {
    onOpenResults(gameDay.id)
  }

  function changeSort(nextSortKey: GameDaySortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(nextSortKey)
    setSortDirection(nextSortKey === "gameDate" ? "desc" : "asc")
  }

  function renderSortHeader(label: string, nextSortKey: GameDaySortKey) {
    const active = sortKey === nextSortKey
    const SortIcon = sortDirection === "asc" ? ArrowUp : ArrowDown

    return (
      <button
        className={`flex items-center gap-1 font-semibold ${active ? "text-foreground" : "text-muted-foreground"}`}
        type="button"
        onClick={() => changeSort(nextSortKey)}
      >
        {label}
        {active ? <SortIcon className="h-3.5 w-3.5" /> : null}
      </button>
    )
  }

  return (
    <section className="space-y-4">
      {formOpen ? (
        <GameDayFormModal
          editing={editing}
          form={form}
          saving={saving}
          onChange={onChange}
          onClose={closeForm}
          onSubmit={onSubmit}
        />
      ) : null}

      {selectedGameDay ? (
        <GameDayDetailModal
          gameDay={selectedGameDay}
          results={selectedGameDay.id === currentGameDayId ? currentResults : detailResults}
          resultsLoading={detailResultsLoading}
          onClose={() => setSelectedGameDay(null)}
          onEdit={editGameDay}
          onOpenResults={openResultsFromDetail}
          onOpenTeams={openTeamsFromDetail}
          readOnly={readOnly}
        />
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-accent" />
              경기 일정
            </CardTitle>
            {readOnly ? (
              <Badge className="border-amber-500/35 bg-amber-500/10 text-amber-700">조회 전용</Badge>
            ) : (
              <Button type="button" size="sm" onClick={openCreateForm}>
                <Plus className="h-4 w-4" />
                경기 등록
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <FilterCount active={statusFilter === "ALL"} label="전체" value={counts.total} onClick={() => setStatusFilter("ALL")} />
              <FilterCount
                active={statusFilter === "SCHEDULED"}
                label="예정"
                value={counts.SCHEDULED}
                onClick={() => setStatusFilter("SCHEDULED")}
              />
              <FilterCount
                active={statusFilter === "COMPLETED"}
                label="완료"
                value={counts.COMPLETED}
                onClick={() => setStatusFilter("COMPLETED")}
              />
              <FilterCount
                active={statusFilter === "HOLIDAY"}
                label="휴무"
                value={counts.HOLIDAY}
                onClick={() => setStatusFilter("HOLIDAY")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-[1fr_150px_150px] md:items-end">
            <div className="relative col-span-2 md:col-span-1">
              <TextInput label="날짜·장소·메모 검색" value={query} onChange={setQuery} />
              <Search className="pointer-events-none absolute bottom-2.5 right-3 h-4 w-4 text-muted-foreground" />
            </div>
            <SelectInput
              label="방식"
              value={modeFilter}
              options={{ ALL: "전체", ...modeLabels }}
              onChange={(mode) => setModeFilter(mode as GameDayMode | "ALL")}
            />
            <SelectInput
              label="구분"
              value={typeFilter}
              options={{ ALL: "전체", ...gameTypeLabels }}
              onChange={(gameType) => setTypeFilter(gameType as GameDayType | "ALL")}
            />
          </div>

          {loading ? (
            <SkeletonRows />
          ) : displayedGameDays.length ? (
            <>
              <div className="grid gap-3 lg:hidden">
                {groupedGameDays.map((group) => (
                  <section key={group.monthKey} className="space-y-2">
                    <h3 className="px-1 text-sm font-black text-muted-foreground">{group.label}</h3>
                    <div className="grid gap-3">
                      {group.gameDays.map((gameDay) => (
                        <GameDayCard key={gameDay.id} gameDay={gameDay} onOpen={(nextGameDay) => void openGameDayDetail(nextGameDay)} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <div className="hidden space-y-4 lg:block">
                {groupedGameDays.map((group) => (
                  <section key={group.monthKey} className="overflow-hidden rounded-md border border-border">
                    <div className="border-b border-border bg-background px-3 py-2">
                      <h3 className="text-sm font-black text-foreground">{group.label}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[920px] table-fixed border-collapse text-sm">
                        <colgroup>
                          <col className="w-[18%]" />
                          <col className="w-[15%]" />
                          <col className="w-[14%]" />
                          <col className="w-[10%]" />
                          <col className="w-[10%]" />
                          <col className="w-[10%]" />
                          <col className="w-[12%]" />
                          <col className="w-[11%]" />
                        </colgroup>
                        <thead className="bg-secondary text-left text-xs font-semibold text-muted-foreground">
                          <tr>
                            <th className="border-b border-border px-3 py-2">{renderSortHeader("날짜", "gameDate")}</th>
                            <th className="border-b border-border px-3 py-2">{renderSortHeader("장소", "place")}</th>
                            <th className="border-b border-border px-3 py-2">시간</th>
                            <th className="border-b border-border px-3 py-2">{renderSortHeader("방식", "mode")}</th>
                            <th className="border-b border-border px-3 py-2">{renderSortHeader("구분", "gameType")}</th>
                            <th className="border-b border-border px-3 py-2">{renderSortHeader("상태", "status")}</th>
                            <th className="border-b border-border px-3 py-2">팀</th>
                            <th className="border-b border-border px-3 py-2">메모</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.gameDays.map((gameDay) => {
                            const cellClassName = getGameDayCellClassName(gameDay)

                            return (
                              <tr
                                key={gameDay.id}
                                className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-secondary/50"
                                onClick={() => void openGameDayDetail(gameDay)}
                              >
                                <td className={`whitespace-nowrap px-3 py-2 font-bold ${cellClassName}`}>{formatGameDate(gameDay.gameDate)}</td>
                                <td className={`truncate px-3 py-2 text-muted-foreground ${cellClassName}`}>{gameDay.place}</td>
                                <td className={`whitespace-nowrap px-3 py-2 text-muted-foreground ${cellClassName}`}>{formatTimeRange(gameDay)}</td>
                                <td className={`whitespace-nowrap px-3 py-2 ${cellClassName}`}>
                                  <Badge>{modeLabels[gameDay.mode]}</Badge>
                                </td>
                                <td className={`whitespace-nowrap px-3 py-2 ${cellClassName}`}>
                                  <Badge>{getGameTypeLabel(gameDay)}</Badge>
                                </td>
                                <td className={`whitespace-nowrap px-3 py-2 ${cellClassName}`}>
                                  <StatusBadge status={gameDay.status} />
                                </td>
                                <td className={`whitespace-nowrap px-3 py-2 ${cellClassName}`}>
                                  <TeamStatusBadge gameDay={gameDay} />
                                </td>
                                <td className={`truncate px-3 py-2 text-muted-foreground ${cellClassName}`}>{gameDay.memo || ""}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <EmptyState title="조건에 맞는 경기 일정이 없습니다." />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function GameDayFormModal({
  editing,
  form,
  saving,
  onChange,
  onClose,
  onSubmit,
}: {
  editing: boolean
  form: GameDayRequest
  saving: boolean
  onChange: (value: GameDayRequest) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-start justify-center bg-background/80 px-4 py-6 backdrop-blur-sm sm:items-center">
      <Card className="modal-panel max-h-[calc(100vh-48px)] w-full max-w-xl overflow-y-auto shadow-2xl">
        <CardHeader className="border-b border-border bg-secondary/30 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              {editing ? <Pencil className="h-5 w-5 text-accent" /> : <CalendarDays className="h-5 w-5 text-accent" />}
              {editing ? "경기 수정" : "경기 등록"}
            </CardTitle>
            <Button className="h-8 w-8" type="button" variant="outline" size="icon" title="닫기" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <form className="space-y-3" onSubmit={onSubmit}>
            <FormSection icon={CalendarDays} title="일정 정보">
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput label="경기일" type="date" value={form.gameDate} onChange={(gameDate) => onChange({ ...form, gameDate })} required />
                <TextInput label="장소" value={form.place} onChange={(place) => onChange({ ...form, place })} required />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <TextInput label="시작 시간" type="time" value={form.startTime} onChange={(startTime) => onChange({ ...form, startTime })} required />
                <TextInput label="종료 시간" type="time" value={form.endTime} onChange={(endTime) => onChange({ ...form, endTime })} required />
              </div>
            </FormSection>

            <FormSection icon={Trophy} title="운영 정보">
              <div className="grid gap-3 sm:grid-cols-3">
                <SelectInput
                  label="방식"
                  value={form.mode}
                  options={modeLabels}
                  onChange={(mode) => onChange({ ...form, mode: mode as GameDayMode })}
                />
                <SelectInput
                  label="구분"
                  value={form.gameType}
                  options={gameTypeLabels}
                  onChange={(gameType) => onChange({ ...form, gameType: gameType as GameDayType })}
                />
                <SelectInput
                  label="상태"
                  value={form.status === "CLOSED" ? "COMPLETED" : form.status}
                  options={editableStatusLabels}
                  onChange={(status) => onChange({ ...form, status: status as GameDayStatus })}
                />
              </div>
            </FormSection>

            <FormSection icon={StickyNote} title="메모">
              <TextArea label="메모" value={form.memo} onChange={(memo) => onChange({ ...form, memo })} />
            </FormSection>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button className="sm:min-w-32" disabled={saving || !form.gameDate || !form.place.trim()}>
                {editing ? <Pencil className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}
                {saving ? "저장 중" : editing ? "수정 완료" : "경기 등록"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function GameDayDetailModal({
  gameDay,
  results,
  resultsLoading,
  onClose,
  onEdit,
  onOpenResults,
  onOpenTeams,
  readOnly = false,
}: {
  gameDay: GameDay
  results: GameResult[]
  resultsLoading: boolean
  onClose: () => void
  onEdit: (gameDay: GameDay) => void
  onOpenResults: (gameDay: GameDay) => void
  onOpenTeams: (gameDay: GameDay) => void
  readOnly?: boolean
}) {
  const resultSummary = getResultSummary(gameDay, results)

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-start justify-center bg-background/80 px-4 py-6 backdrop-blur-sm sm:items-center">
      <Card className="modal-panel max-h-[calc(100vh-48px)] w-full max-w-lg overflow-y-auto shadow-2xl">
        <CardHeader className="border-b border-border bg-background px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap gap-1.5">
                <StatusBadge status={gameDay.status} />
                <Badge>{getGameTypeLabel(gameDay)}</Badge>
                <Badge>{modeLabels[gameDay.mode]}</Badge>
                <TeamStatusBadge gameDay={gameDay} />
              </div>
              <CardTitle className="text-2xl leading-tight">{formatGameDate(gameDay.gameDate)}</CardTitle>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {gameDay.place}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {formatTimeRange(gameDay)}
                </span>
              </p>
            </div>
            <Button className="h-9 w-9 shrink-0" type="button" variant="outline" size="icon" title="닫기" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="button" className="h-11 border border-sky-500/40 bg-sky-500/15 text-sky-700 hover:bg-sky-500/25" onClick={() => onOpenTeams(gameDay)}>
              <UsersRound className="h-4 w-4" />
              {readOnly ? "팀 보기" : "팀 구성"}
            </Button>
            <Button
              type="button"
              className="h-11 border border-emerald-600/40 bg-emerald-600/15 text-emerald-700 hover:bg-emerald-600/25 disabled:border-border disabled:bg-secondary/50 disabled:text-muted-foreground"
              disabled={!canRecordResults(gameDay)}
              onClick={() => onOpenResults(gameDay)}
            >
              <ClipboardList className="h-4 w-4" />
              {readOnly ? "결과 보기" : "결과 입력"}
            </Button>
          </div>

          {gameDay.memo ? (
            <section className="rounded-md border border-border bg-secondary/20 p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-black">
                <StickyNote className="h-4 w-4 text-accent" />
                메모
              </h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{gameDay.memo}</p>
            </section>
          ) : null}

          {resultsLoading ? (
            <section className="rounded-md border border-border bg-secondary/20 p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-black">
                <Trophy className="h-4 w-4 text-accent" />
                경기 결과
              </h3>
              <p className="text-sm font-semibold text-muted-foreground">결과 확인 중</p>
            </section>
          ) : resultSummary.length ? (
            <section className="rounded-md border border-border bg-background p-3">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-black">
                <Trophy className="h-4 w-4 text-amber-600" />
                경기 결과 랭킹
              </h3>
              <div className="overflow-hidden rounded-md border border-border">
                {resultSummary.map((summary) => (
                  <div key={summary.team} className="grid grid-cols-[48px_1fr_auto] items-center gap-2 border-b border-border bg-white px-3 py-2.5 last:border-b-0">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-black ${summary.rank === 1 ? "bg-amber-400 text-slate-950" : "bg-secondary text-muted-foreground"}`}>
                      {summary.rank === 1 ? <Crown className="h-4 w-4" /> : summary.rank}
                    </div>
                    <span className={`w-fit rounded-md border px-2 py-1 text-xs font-black ${resultTeamLabelTone(summary.team)}`}>
                      {teamLabels[summary.team]}
                    </span>
                    <span className="whitespace-nowrap text-sm font-black text-foreground">
                      {summary.win}승 {summary.draw}무 {summary.loss}패
                    </span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {!readOnly ? (
            <div className="flex border-t border-border pt-3 sm:justify-end">
              <Button type="button" variant="outline" onClick={() => onEdit(gameDay)}>
                <Pencil className="h-4 w-4" />
                수정
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

function GameDayCard({ gameDay, onOpen }: { gameDay: GameDay; onOpen: (gameDay: GameDay) => void }) {
  const scheduled = gameDay.status === "SCHEDULED"
  return (
    <article
      className={`cursor-pointer rounded-md border p-4 transition-colors hover:bg-secondary/50 ${
        scheduled
          ? "border-accent/60 bg-accent/15 shadow-[inset_4px_0_0_hsl(var(--accent))]"
          : "border-border bg-secondary/30"
      }`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(gameDay)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(gameDay)
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black">{formatGameDate(gameDay.gameDate)}</h2>
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            {gameDay.place} · {formatTimeRange(gameDay)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-center gap-1.5 text-center">
          <StatusBadge status={gameDay.status} />
          <Badge>{getGameTypeLabel(gameDay)}</Badge>
          <Badge>{modeLabels[gameDay.mode]}</Badge>
          <TeamStatusBadge gameDay={gameDay} />
        </div>
      </div>
      {gameDay.memo ? <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{gameDay.memo}</p> : null}
    </article>
  )
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof CalendarDays
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-md border border-border bg-secondary/15 p-3">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-black text-foreground">
        <Icon className="h-4 w-4 text-accent" />
        {title}
      </h3>
      {children}
    </section>
  )
}

function FilterCount({
  active,
  label,
  value,
  onClick,
}: {
  active: boolean
  label: string
  value: number
  onClick: () => void
}) {
  return (
    <button
      className={`flex min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors sm:min-w-24 sm:gap-3 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
      }`}
      type="button"
      onClick={onClick}
    >
      <span className={`text-xs font-semibold ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-lg font-black leading-none ${active ? "text-primary-foreground" : "text-foreground"}`}>{value}</span>
    </button>
  )
}

function StatusBadge({ status }: { status: GameDayStatus }) {
  const tone = {
    SCHEDULED: "border-accent/40 bg-accent/10 text-accent",
    COMPLETED: "border-emerald-600/40 bg-emerald-600/10 text-emerald-700",
    HOLIDAY: "border-red-500/40 bg-red-500/10 text-red-700",
    CLOSED: "border-slate-400/50 bg-slate-500/10 text-slate-600",
  }[status]

  return <Badge className={tone}>{gameStatusLabels[status]}</Badge>
}

function TeamStatusBadge({ gameDay }: { gameDay: GameDay }) {
  const teamCount = gameDay.teamCount ?? 0
  const ready = teamCount > 0

  return (
    <Badge className={ready ? "border-sky-500/40 bg-sky-500/10 text-sky-700" : "border-border bg-background/70 text-muted-foreground"}>
      {ready ? `${teamCount}팀 구성` : "팀 미구성"}
    </Badge>
  )
}

function resultTeamLabelTone(team: TeamName) {
  return {
    BLACK: "border-zinc-900 bg-zinc-950 text-white",
    WHITE: "border-zinc-300 bg-white text-zinc-900",
    RED: "border-red-700 bg-red-600 text-white",
  }[team]
}

function formatGameDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value))
}

function formatTimeRange(gameDay: GameDay) {
  return `${gameDay.startTime.slice(0, 5)}-${gameDay.endTime.slice(0, 5)}`
}

function compareGameDays(left: GameDay, right: GameDay, sortKey: GameDaySortKey, sortDirection: SortDirection) {
  const direction = sortDirection === "asc" ? 1 : -1
  const leftValue = getGameDaySortValue(left, sortKey)
  const rightValue = getGameDaySortValue(right, sortKey)

  return (
    String(leftValue).localeCompare(String(rightValue), "ko-KR") ||
    left.gameDate.localeCompare(right.gameDate)
  ) * direction
}

function getGameDaySortValue(gameDay: GameDay, sortKey: GameDaySortKey) {
  if (sortKey === "mode") {
    return modeLabels[gameDay.mode]
  }

  if (sortKey === "gameType") {
    return getGameTypeLabel(gameDay)
  }

  if (sortKey === "status") {
    return gameStatusLabels[gameDay.status]
  }

  return gameDay[sortKey] || ""
}

function getGameType(gameDay: GameDay) {
  return (gameDay.gameType || "REGULAR") as GameDayType
}

function getGameTypeLabel(gameDay: GameDay) {
  return gameTypeLabels[getGameType(gameDay)]
}

function canRecordResults(gameDay: GameDay) {
  return getGameType(gameDay) === "REGULAR" && gameDay.status !== "HOLIDAY" && gameDay.status !== "CLOSED"
}

function getResultSummary(gameDay: GameDay, results: GameResult[]) {
  if (!canRecordResults(gameDay)) {
    return []
  }

  const matchups = getResultMatchups(gameDay)
  const teams = Array.from(new Set(matchups.flatMap((matchup) => [matchup.team1Name, matchup.team2Name])))
  const records = new Map(
    teams.map((team) => [team, { team, win: 0, draw: 0, loss: 0 }]),
  )
  const finalResults = matchups.map((matchup) => {
    const finalResult = results.find((result) => result.matchNo === matchup.matchNo && result.quarterNo === 4)
    return finalResult ? { matchup, result: finalResult, winner: getFinalWinner(finalResult) } : null
  })

  if (finalResults.some((result) => !result?.winner)) {
    return []
  }

  finalResults.forEach((finalResult) => {
    if (!finalResult?.winner) {
      return
    }

    const team1Record = records.get(finalResult.result.team1Name)
    const team2Record = records.get(finalResult.result.team2Name)

    if (!team1Record || !team2Record) {
      return
    }

    if (finalResult.winner === "DRAW") {
      team1Record.draw += 1
      team2Record.draw += 1
      return
    }

    if (finalResult.winner === finalResult.result.team1Name) {
      team1Record.win += 1
      team2Record.loss += 1
      return
    }

    team2Record.win += 1
    team1Record.loss += 1
  })

  let previousScore: string | null = null
  let previousRank = 0

  return teams
    .map((team) => records.get(team))
    .filter((record): record is NonNullable<typeof record> => Boolean(record))
    .sort((left, right) => right.win - left.win || left.loss - right.loss || right.draw - left.draw || teamLabels[left.team].localeCompare(teamLabels[right.team], "ko"))
    .map((record, index) => {
      const score = `${record.win}:${record.draw}:${record.loss}`
      const rank = score === previousScore ? previousRank : index + 1
      previousScore = score
      previousRank = rank

      return { ...record, rank }
    })
}

function getResultMatchups(gameDay: GameDay) {
  if (gameDay.mode === "TWO_WAY") {
    return [
      { matchNo: 1, team1Name: "BLACK" as TeamName, team2Name: "WHITE" as TeamName, label: "1차" },
      { matchNo: 2, team1Name: "BLACK" as TeamName, team2Name: "WHITE" as TeamName, label: "2차" },
      { matchNo: 3, team1Name: "BLACK" as TeamName, team2Name: "WHITE" as TeamName, label: "3차" },
    ]
  }

  return [
    { matchNo: 1, team1Name: "BLACK" as TeamName, team2Name: "RED" as TeamName, label: "" },
    { matchNo: 2, team1Name: "BLACK" as TeamName, team2Name: "WHITE" as TeamName, label: "" },
    { matchNo: 3, team1Name: "WHITE" as TeamName, team2Name: "RED" as TeamName, label: "" },
  ]
}

function getFinalWinner(result: GameResult | undefined): TeamName | "DRAW" | null {
  if (!result) {
    return null
  }

  if (result.team1Score === result.team2Score) {
    return "DRAW"
  }

  return result.team1Score > result.team2Score ? result.team1Name : result.team2Name
}

function groupGameDaysByMonth(gameDays: GameDay[]) {
  const groups = new Map<string, GameDay[]>()

  for (const gameDay of gameDays) {
    const monthKey = gameDay.gameDate.slice(0, 7)
    groups.set(monthKey, [...(groups.get(monthKey) ?? []), gameDay])
  }

  return Array.from(groups.entries()).map(([monthKey, groupedGameDays]) => ({
    monthKey,
    label: formatGameMonth(monthKey),
    gameDays: groupedGameDays,
  }))
}

function formatGameMonth(monthKey: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(new Date(`${monthKey}-01`))
}

function getGameDayCellClassName(gameDay: GameDay) {
  if (gameDay.status === "SCHEDULED") {
    return "bg-accent/15 first:border-l-4 first:border-l-accent"
  }

  return "bg-secondary/20"
}
