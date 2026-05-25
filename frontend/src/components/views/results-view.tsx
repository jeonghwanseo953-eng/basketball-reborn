import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react"
import { Check, Plus, Trophy, UsersRound, X } from "lucide-react"

import { EmptyState, SkeletonRows } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { teamLabels } from "@/lib/labels"
import type { GameDay, GameResult, GameResultRequest, Team, TeamName } from "@/types/api"

type Matchup = {
  matchNo: number
  team1Name: TeamName
  team2Name: TeamName
  label?: string
}

type ActiveSlot = {
  matchNo: number
  quarterNo: number
}

const quarters = [1, 2, 3, 4]

export function ResultsView({
  gameDays,
  results,
  teams,
  selectedGameDayId,
  form,
  editingResultId,
  loading,
  saving,
  onChange,
  onSubmit,
  onEdit,
  onCancelEdit,
  readOnly = false,
}: {
  gameDays: GameDay[]
  results: GameResult[]
  teams: Team[]
  selectedGameDayId: number
  form: GameResultRequest
  editingResultId: number | null
  loading: boolean
  saving: boolean
  onSelectGameDay: (gameDayId: number) => void
  onChange: (value: GameResultRequest) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEdit: (result: GameResult) => void
  onCancelEdit: () => void
  readOnly?: boolean
}) {
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null)
  const [selectedTeamName, setSelectedTeamName] = useState<TeamName | null>(null)
  const [wasSaving, setWasSaving] = useState(false)
  const regularGameDays = gameDays.filter((gameDay) => gameDay.gameType === "REGULAR" && gameDay.status !== "HOLIDAY" && gameDay.status !== "CLOSED")
  const selectedGameDay = regularGameDays.find((gameDay) => gameDay.id === selectedGameDayId)
  const selectedTeam = teams.find((team) => team.name === selectedTeamName)
  const matchups = getMatchups(selectedGameDay)
  const selectedMatchup = matchups.find((matchup) => matchup.matchNo === form.matchNo)
  const duplicatedSlot = results.some(
    (result) => result.id !== editingResultId && result.matchNo === form.matchNo && result.quarterNo === form.quarterNo,
  )
  const negativeScore = form.team1Score < 0 || form.team2Score < 0
  const invalid = !selectedGameDay || !selectedMatchup || duplicatedSlot || negativeScore

  useEffect(() => {
    if (wasSaving && !saving) {
      setActiveSlot(null)
    }
    setWasSaving(saving)
  }, [saving, wasSaving])

  useEffect(() => {
    setSelectedTeamName(null)
  }, [selectedGameDayId])

  function cancelInlineEdit() {
    onCancelEdit()
    setActiveSlot(null)
  }

  function resultFor(matchNo: number, quarterNo: number) {
    return results.find((result) => result.matchNo === matchNo && result.quarterNo === quarterNo)
  }

  function openSlot(matchup: Matchup, quarterNo: number) {
    if (readOnly) {
      return
    }

    const existingResult = resultFor(matchup.matchNo, quarterNo)

    if (existingResult) {
      onEdit(existingResult)
      setActiveSlot({ matchNo: matchup.matchNo, quarterNo })
      return
    }

    onCancelEdit()
    onChange({
      gameDayId: selectedGameDayId,
      matchNo: matchup.matchNo,
      quarterNo,
      team1Name: matchup.team1Name,
      team2Name: matchup.team2Name,
      team1Score: 0,
      team2Score: 0,
      memo: "",
    })
    setActiveSlot({ matchNo: matchup.matchNo, quarterNo })
  }

  function handleInlineScoreKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      event.preventDefault()
      cancelInlineEdit()
    }
  }

  function renderScoreSlot(matchup: Matchup, quarterNo: number, variant: "mobile" | "table") {
    const result = resultFor(matchup.matchNo, quarterNo)
    const isActiveSlot = activeSlot?.matchNo === matchup.matchNo && activeSlot.quarterNo === quarterNo
    const slotHeight = variant === "mobile" ? "min-h-12" : "min-h-16 sm:min-h-20"
    const buttonHeight = variant === "mobile" ? "h-12" : "h-16 sm:h-20"

    if (isActiveSlot) {
      if (variant === "mobile") {
        return (
          <form className="rounded-md border border-accent/35 bg-white p-2.5 shadow-sm shadow-slate-900/10" onSubmit={onSubmit}>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-black text-slate-500">{teamLabels[matchup.team1Name]}</span>
                <input
                  autoFocus
                  className="h-11 w-full rounded-md border border-slate-300 bg-white text-center text-lg font-black text-slate-950 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                  inputMode="numeric"
                  min={0}
                  type="number"
                  value={form.team1Score}
                  onChange={(event) => onChange({ ...form, team1Score: Number(event.target.value || 0) })}
                  onFocus={(event) => event.target.select()}
                  onKeyDown={handleInlineScoreKeyDown}
                />
              </label>
              <label className="min-w-0">
                <span className="mb-1 block text-[11px] font-black text-slate-500">{teamLabels[matchup.team2Name]}</span>
                <input
                  className="h-11 w-full rounded-md border border-slate-300 bg-white text-center text-lg font-black text-slate-950 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20"
                  inputMode="numeric"
                  min={0}
                  type="number"
                  value={form.team2Score}
                  onChange={(event) => onChange({ ...form, team2Score: Number(event.target.value || 0) })}
                  onFocus={(event) => event.target.select()}
                  onKeyDown={handleInlineScoreKeyDown}
                />
              </label>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                className="inline-flex h-9 items-center justify-center rounded-md bg-slate-900 text-sm font-black text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
                disabled={saving || invalid}
                type="submit"
              >
                저장
              </button>
              <button
                className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white text-sm font-black text-slate-600 transition-colors hover:bg-slate-100"
                type="button"
                onClick={cancelInlineEdit}
              >
                취소
              </button>
            </div>
          </form>
        )
      }

      return (
        <form className={`mx-auto flex ${slotHeight} max-w-[150px] flex-col justify-center gap-1.5`} onSubmit={onSubmit}>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
            <label className="min-w-0">
              <input
                autoFocus
                className="h-9 w-full rounded-sm border border-slate-300 bg-white text-center text-base font-black text-slate-950 outline-none transition-colors focus:border-accent"
                inputMode="numeric"
                min={0}
                type="number"
                value={form.team1Score}
                onChange={(event) => onChange({ ...form, team1Score: Number(event.target.value || 0) })}
                onFocus={(event) => event.target.select()}
                onKeyDown={handleInlineScoreKeyDown}
              />
            </label>
            <span className="text-sm font-black text-slate-500">:</span>
            <label className="min-w-0">
              <input
                className="h-9 w-full rounded-sm border border-slate-300 bg-white text-center text-base font-black text-slate-950 outline-none transition-colors focus:border-accent"
                inputMode="numeric"
                min={0}
                type="number"
                value={form.team2Score}
                onChange={(event) => onChange({ ...form, team2Score: Number(event.target.value || 0) })}
                onFocus={(event) => event.target.select()}
                onKeyDown={handleInlineScoreKeyDown}
              />
            </label>
          </div>
          <div className="flex items-center justify-center gap-1">
            <button
              className="inline-flex h-7 w-8 items-center justify-center rounded-sm bg-slate-900 text-white transition-colors hover:bg-slate-800 disabled:opacity-50"
              disabled={saving || invalid}
              title="저장"
              type="submit"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              className="inline-flex h-7 w-8 items-center justify-center rounded-sm border border-slate-300 bg-white text-slate-600 transition-colors hover:bg-slate-100"
              title="취소"
              type="button"
              onClick={cancelInlineEdit}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      )
    }

    if (variant === "mobile") {
      return (
        <button
          className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
            result ? "border-slate-200 bg-white text-slate-900" : "border-dashed border-slate-300 bg-white text-slate-400"
          } ${readOnly ? "cursor-default" : "hover:border-accent/45 hover:bg-slate-50"}`}
          type="button"
          disabled={readOnly}
          onClick={() => openSlot(matchup, quarterNo)}
        >
          {result ? (
            <span className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <span className="min-w-0 truncate text-xs font-black text-slate-500">{teamLabels[result.team1Name]}</span>
              <span className="text-xl font-black text-slate-950">
                {result.team1Score} : {result.team2Score}
              </span>
              <span className="min-w-0 truncate text-right text-xs font-black text-slate-500">{teamLabels[result.team2Name]}</span>
            </span>
          ) : (
            <span className="flex h-10 items-center justify-center gap-1.5 text-sm font-black">
              <Plus className="h-4 w-4" />
              {readOnly ? "-" : "점수 입력"}
            </span>
          )}
        </button>
      )
    }

    return (
      <button
        className={`${buttonHeight} w-full rounded-sm text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 ${
          result ? "bg-white text-slate-900" : "bg-white text-slate-400"
        } ${readOnly ? "cursor-default" : "hover:bg-slate-100"}`}
        type="button"
        disabled={readOnly}
        onClick={() => openSlot(matchup, quarterNo)}
      >
        {result ? (
          <span className="flex items-center justify-center gap-1 text-xl font-black sm:text-2xl">
            <span>{result.team1Score}</span>
            <span>:</span>
            <span>{result.team2Score}</span>
          </span>
        ) : (
            <span className="flex flex-col items-center gap-1">
              <Plus className="h-4 w-4" />
              <span className="text-[11px] font-black">{readOnly ? "-" : "입력"}</span>
            </span>
        )}
      </button>
    )
  }

  return (
    <>
      <section className="space-y-4">
        <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-accent" />
              경기 결과
            </CardTitle>
            <Badge>{selectedGameDay?.mode === "TWO_WAY" ? "2파전" : "3파전"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <SkeletonRows />
          ) : selectedGameDay ? (
            <div className="space-y-3">
              <div className="space-y-3 sm:hidden">
                {matchups.map((matchup) => {
                  const finalResult = resultFor(matchup.matchNo, 4)
                  const finalWinner = getWinner(finalResult)

                  return (
                    <section key={matchup.matchNo} className="overflow-hidden rounded-lg border border-border bg-secondary/25 shadow-sm shadow-slate-900/5">
                      <div className="border-b border-border bg-card px-3 py-3">
                        <div className="flex min-w-0 flex-col items-center justify-center gap-1.5">
                          {matchup.label ? <span className="text-xs font-black text-slate-500">{matchup.label}</span> : null}
                          <div className="flex min-w-0 items-center justify-center gap-1.5 text-sm font-black">
                            <TeamWithWinner team={matchup.team1Name} winner={finalWinner === matchup.team1Name} onClick={setSelectedTeamName} />
                            <span className="text-slate-500">:</span>
                            <TeamWithWinner team={matchup.team2Name} winner={finalWinner === matchup.team2Name} onClick={setSelectedTeamName} reverse />
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2 p-2.5">
                        {quarters.map((quarterNo) => {
                          const isActiveSlot = activeSlot?.matchNo === matchup.matchNo && activeSlot.quarterNo === quarterNo

                          return (
                            <div key={quarterNo} className={`grid grid-cols-[44px_1fr] items-stretch gap-2 ${isActiveSlot ? "rounded-md bg-accent/10 p-1.5" : ""}`}>
                              <div className="flex items-center justify-center rounded-md border border-border bg-card text-sm font-black text-slate-700">
                                {quarterNo}Q
                              </div>
                              <div>{renderScoreSlot(matchup, quarterNo, "mobile")}</div>
                            </div>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>

              <div className="hidden overflow-x-auto rounded-md border-2 border-slate-700/70 bg-slate-50 sm:block">
                <table
                  className="w-full table-fixed border-collapse text-sm"
                  style={{ minWidth: matchups.length >= 3 ? 420 : 340 }}
                >
                  <colgroup>
                    <col className="w-12" />
                    {matchups.map((matchup) => (
                      <col key={matchup.matchNo} />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border-b-2 border-r-2 border-slate-700/70 px-1.5 py-3" />
                      {matchups.map((matchup) => {
                        const finalResult = resultFor(matchup.matchNo, 4)
                        const finalWinner = getWinner(finalResult)

                        return (
                          <th key={matchup.matchNo} className="border-b-2 border-r-2 border-slate-700/70 px-2 py-3 last:border-r-0">
                            <div className="flex min-w-0 flex-col items-center justify-center gap-1">
                              {matchup.label ? <span className="text-[11px] font-black text-slate-500">{matchup.label}</span> : null}
                              <div className="flex min-w-0 items-center justify-center gap-1.5 text-sm font-black sm:text-base">
                                <TeamWithWinner team={matchup.team1Name} winner={finalWinner === matchup.team1Name} onClick={setSelectedTeamName} />
                                <span className="text-slate-500">:</span>
                                <TeamWithWinner team={matchup.team2Name} winner={finalWinner === matchup.team2Name} onClick={setSelectedTeamName} reverse />
                              </div>
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {quarters.map((quarterNo, quarterIndex) => {
                      const lastQuarter = quarterIndex === quarters.length - 1

                      return (
                      <tr key={quarterNo}>
                        <th className={`border-r-2 border-slate-700/70 bg-slate-100 px-1.5 py-3 text-center text-sm font-black text-slate-700 ${lastQuarter ? "" : "border-b-2"}`}>
                          {quarterNo}Q
                        </th>
                        {matchups.map((matchup) => {
                          const isActiveSlot = activeSlot?.matchNo === matchup.matchNo && activeSlot.quarterNo === quarterNo

                          return (
                            <td
                              key={matchup.matchNo}
                              className={`border-r-2 border-slate-700/70 p-1.5 last:border-r-0 ${lastQuarter ? "" : "border-b-2"} ${
                                isActiveSlot ? "bg-slate-50" : "bg-white"
                              }`}
                            >
                              {renderScoreSlot(matchup, quarterNo, "table")}
                            </td>
                          )
                        })}
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <EmptyState title="결과를 입력할 정규 경기를 선택하세요." />
          )}
        </CardContent>
        </Card>
      </section>

      {selectedTeamName ? (
        <TeamMembersPopover team={selectedTeam} teamName={selectedTeamName} onClose={() => setSelectedTeamName(null)} />
      ) : null}
    </>
  )
}

function getMatchups(gameDay: GameDay | undefined): Matchup[] {
  if (gameDay?.mode === "TWO_WAY") {
    return [
      { matchNo: 1, team1Name: "BLACK", team2Name: "WHITE", label: "1차" },
      { matchNo: 2, team1Name: "BLACK", team2Name: "WHITE", label: "2차" },
      { matchNo: 3, team1Name: "BLACK", team2Name: "WHITE", label: "3차" },
    ]
  }

  return [
    { matchNo: 1, team1Name: "BLACK", team2Name: "RED" },
    { matchNo: 2, team1Name: "BLACK", team2Name: "WHITE" },
    { matchNo: 3, team1Name: "WHITE", team2Name: "RED" },
  ]
}

function getWinner(result: GameResult | undefined): TeamName | "DRAW" | null {
  if (!result) {
    return null
  }

  if (result.team1Score === result.team2Score) {
    return "DRAW"
  }

  return result.team1Score > result.team2Score ? result.team1Name : result.team2Name
}

function TeamMembersPopover({ team, teamName, onClose }: { team: Team | undefined; teamName: TeamName; onClose: () => void }) {
  const members = [...(team?.members ?? [])].sort((memberA, memberB) => memberA.playerName.localeCompare(memberB.playerName, "ko"))

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/45 px-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        className="w-full max-w-sm rounded-md border border-border bg-card p-4 shadow-xl shadow-slate-900/15"
        role="dialog"
        aria-modal="true"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-md border ${teamTone(teamName)}`}>
              <UsersRound className="h-4 w-4" />
            </span>
            <div>
              <p className="text-base font-black text-foreground">{teamLabels[teamName]} 팀</p>
              <p className="text-xs font-semibold text-muted-foreground">구성원 {members.length}명</p>
            </div>
          </div>
          <button
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            title="닫기"
            type="button"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {members.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {members.map((member, index) => (
              <div key={member.id} className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-background text-xs font-black text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 truncate text-sm font-black text-foreground">{member.playerName}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-dashed border-border bg-secondary/25 px-3 py-6 text-center text-sm font-semibold text-muted-foreground">
            아직 구성원이 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

function TeamWithWinner({
  team,
  winner,
  reverse = false,
  onClick,
}: {
  team: TeamName
  winner: boolean
  reverse?: boolean
  onClick: (team: TeamName) => void
}) {
  const trophy = winner ? <Trophy className="h-4 w-4 shrink-0 fill-yellow-400 text-yellow-600 drop-shadow-[0_1px_0_rgba(0,0,0,0.45)]" /> : null

  return (
    <span className="inline-flex items-center gap-1">
      {!reverse ? trophy : null}
      <TeamBadge team={team} compact onClick={onClick} />
      {reverse ? trophy : null}
    </span>
  )
}

function TeamBadge({
  team,
  compact = false,
  onClick,
}: {
  team: TeamName
  compact?: boolean
  onClick?: (team: TeamName) => void
}) {
  const className = `inline-flex items-center gap-1 rounded-md border font-black ${compact ? "px-2 py-1 text-xs sm:px-2.5 sm:text-sm" : "px-2 py-1 text-xs"} ${teamTone(team)} ${
    onClick ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30" : ""
  }`

  if (onClick) {
    return (
      <button className={className} title="구성원 확인" type="button" onClick={() => onClick(team)}>
        {teamLabels[team]}
      </button>
    )
  }

  return <span className={className}>{teamLabels[team]}</span>
}

function teamTone(team: TeamName) {
  return {
    BLACK: "border-zinc-900 bg-zinc-950 text-white",
    WHITE: "border-zinc-300 bg-white text-zinc-900",
    RED: "border-red-700 bg-red-600 text-white",
  }[team]
}
