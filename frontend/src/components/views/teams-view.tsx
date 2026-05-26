import { useEffect, useState, type DragEvent, type FormEvent } from "react"
import { ArrowDownAZ, GripVertical, LayoutGrid, ListFilter, RotateCcw, Search, Shield, Trash2, UserPlus, UsersRound, X } from "lucide-react"

import { EmptyState, NumberInput, SelectInput, SkeletonRows, TextInput } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { teamLabels } from "@/lib/labels"
import type { GameDay, Member, MemberRequest, Team, TeamName } from "@/types/api"

type TeamSortMode = "manual" | "name" | "position"
type SelectedPlayer = {
  memberId: number
  name: string
  teamName: TeamName | null
}
type TeamValidationIssue = {
  tone: "warning" | "danger"
  message: string
}
type GuestForm = Pick<MemberRequest, "name" | "position" | "height">
const emptyGuestForm: GuestForm = {
  name: "",
  position: "가드",
  height: null,
}
const guestPositionOptions = {
  "가드": "가드",
  "포워드": "포워드",
  "센터": "센터",
}

export function TeamsView({
  gameDays,
  members,
  teams,
  selectedGameDayId,
  loading,
  saving,
  validationIssues,
  onMoveMember,
  onCreateGuest,
  onDeleteGuest,
  onResetTeams,
  readOnly = false,
}: {
  gameDays: GameDay[]
  members: Member[]
  teams: Team[]
  selectedGameDayId: number
  loading: boolean
  saving: boolean
  validationIssues: TeamValidationIssue[]
  onMoveMember: (memberId: number, teamName: TeamName | null) => void
  onCreateGuest: (payload: MemberRequest) => Promise<Member | null>
  onDeleteGuest: (member: Member) => Promise<boolean>
  onResetTeams: () => void
  readOnly?: boolean
}) {
  const [dragOverTarget, setDragOverTarget] = useState<TeamName | "POOL" | null>(null)
  const [teamSortMode, setTeamSortMode] = useState<TeamSortMode>("name")
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [guestModalOpen, setGuestModalOpen] = useState(false)
  const [guestFormOpen, setGuestFormOpen] = useState(false)
  const [guestQuery, setGuestQuery] = useState("")
  const [guestForm, setGuestForm] = useState<GuestForm>(emptyGuestForm)
  const [guestFormError, setGuestFormError] = useState<string | null>(null)
  const [deleteGuestConfirm, setDeleteGuestConfirm] = useState<Member | null>(null)
  const [highlightedMemberId, setHighlightedMemberId] = useState<number | null>(null)
  const selectedGameDay = gameDays.find((gameDay) => gameDay.id === selectedGameDayId)
  const memberById = new Map(members.map((member) => [member.id, member]))
  const participantMembers = members
    .filter((member) => member.status === "REGULAR" || member.status === "GUEST")
    .sort(compareParticipants)
  const guestMembers = members
    .filter((member) => member.status === "GUEST")
    .sort((left, right) => left.name.localeCompare(right.name, "ko"))
  const filteredGuestMembers = guestMembers.filter((member) => {
    const keyword = guestQuery.trim().toLowerCase()
    if (!keyword) {
      return true
    }

    return [member.name, member.position ?? "", member.height ? `${member.height}` : ""]
      .join(" ")
      .toLowerCase()
      .includes(keyword)
  })
  const expectedTeamNames: TeamName[] = selectedGameDay?.mode === "TWO_WAY" ? ["BLACK", "WHITE"] : ["BLACK", "WHITE", "RED"]
  const assignedPlayerByMemberId = new Map<number, TeamName>()

  for (const team of teams) {
    for (const member of team.members) {
      if (member.memberId) {
        assignedPlayerByMemberId.set(member.memberId, team.name)
      }
    }
  }

  const participantRows = participantMembers.map((member) => ({
    ...member,
    teamName: assignedPlayerByMemberId.get(member.id) ?? null,
  }))
  const unassignedRows = participantRows.filter((row) => !row.teamName)
  const assignedParticipantCount = participantRows.length - unassignedRows.length

  useEffect(() => {
    if (!highlightedMemberId) {
      return
    }

    const timeoutId = window.setTimeout(() => setHighlightedMemberId(null), 2200)

    return () => window.clearTimeout(timeoutId)
  }, [highlightedMemberId])

  function getTeam(name: TeamName) {
    return teams.find((team) => team.name === name)
  }

  function sortedTeamMembers(team: Team | undefined) {
    const members = team?.members ?? []

    if (teamSortMode === "manual") {
      return members
    }

    return [...members].sort((left, right) => {
      const leftMember = left.memberId ? memberById.get(left.memberId) : null
      const rightMember = right.memberId ? memberById.get(right.memberId) : null
      const guestOrder = participantStatusRank(leftMember) - participantStatusRank(rightMember)

      if (guestOrder !== 0) {
        return guestOrder
      }

      if (teamSortMode === "position") {
        return (
          positionRank(leftMember?.position) - positionRank(rightMember?.position) ||
          left.playerName.localeCompare(right.playerName)
        )
      }

      return left.playerName.localeCompare(right.playerName)
    })
  }

  function startDrag(event: DragEvent<HTMLElement>, memberId: number) {
    if (readOnly) return
    event.dataTransfer.effectAllowed = "move"
    event.dataTransfer.setData("text/plain", String(memberId))
  }

  function allowDrop(event: DragEvent<HTMLElement>, target: TeamName | "POOL") {
    if (readOnly) return
    event.preventDefault()
    event.dataTransfer.dropEffect = "move"
    setDragOverTarget(target)
  }

  function dropMember(event: DragEvent<HTMLElement>, teamName: TeamName | null) {
    event.preventDefault()
    setDragOverTarget(null)

    const memberId = Number(event.dataTransfer.getData("text/plain"))

    if (!memberId || saving || readOnly) {
      return
    }

    setHighlightedMemberId(teamName ? memberId : null)
    onMoveMember(memberId, teamName)
  }

  function moveSelectedPlayer(teamName: TeamName | null) {
    if (!selectedPlayer || selectedPlayer.teamName === teamName || readOnly) {
      setSelectedPlayer(null)
      return
    }

    setHighlightedMemberId(teamName ? selectedPlayer.memberId : null)
    onMoveMember(selectedPlayer.memberId, teamName)
    setSelectedPlayer(null)
  }

  async function submitGuest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly || saving) {
      return
    }

    const name = guestForm.name.trim()
    if (!name) {
      setGuestFormError("이름을 입력해주세요.")
      return
    }

    setGuestFormError(null)
    const created = await onCreateGuest({
      name,
      birthYear: null,
      height: guestForm.height,
      position: guestForm.position,
      region: "",
      role: "NONE",
      status: "GUEST",
      restUntilDate: null,
      memo: "",
    })

    if (created) {
      setGuestForm(emptyGuestForm)
      setGuestFormOpen(false)
      setGuestQuery("")
      setSelectedPlayer({ memberId: created.id, name: created.name, teamName: null })
    }
  }

  return (
    <section className="space-y-3">
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pb-3 pt-0">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              경기별 팀 구성
            </CardTitle>
            <div className="flex flex-wrap items-center justify-end gap-1.5">
              {readOnly ? <Badge className="border-amber-500/35 bg-amber-500/10 text-amber-700">조회 전용</Badge> : null}
              {saving ? <Badge className="border-accent/40 bg-accent/10 text-accent">저장 중</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pb-0">
          <section className="rounded-md border border-border bg-secondary/25 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground">팀 구성 담당자</p>
                <p className="mt-1 text-base font-black">{selectedGameDay?.teamBuilderName ?? "미지정"}</p>
              </div>
              {readOnly ? (
                <p className="text-sm font-semibold text-muted-foreground">
                  담당자, 회장, 웹관리자만 팀 구성을 수정할 수 있습니다.
                </p>
              ) : null}
            </div>
          </section>

          {!readOnly && validationIssues.length ? (
            <section className="grid gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
              {validationIssues.map((issue) => (
                <p
                  key={issue.message}
                  className={`text-sm font-semibold ${issue.tone === "danger" ? "text-red-700" : "text-amber-700"}`}
                >
                  {issue.message}
                </p>
              ))}
            </section>
          ) : null}

          <section
            className={`rounded-md border p-3 transition-colors ${
              dragOverTarget === "POOL" ? "border-dashed border-accent bg-accent/10 ring-2 ring-accent/20" : "border-border bg-secondary/35"
            }`}
            onDragOver={(event) => allowDrop(event, "POOL")}
            onDragLeave={() => setDragOverTarget(null)}
            onDrop={(event) => dropMember(event, null)}
          >
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center gap-2 text-sm font-black">
                <UsersRound className="h-4 w-4 text-accent" />
                참석자 풀
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-border bg-card px-2.5 text-xs font-black text-foreground hover:bg-secondary"
                    onClick={() => setGuestModalOpen(true)}
                  >
                    <Search className="h-3.5 w-3.5" />
                    게스트
                  </Button>
                ) : null}
                <Badge>{assignedParticipantCount}/{participantRows.length}명</Badge>
                <Badge className={unassignedRows.length ? "border-primary/40 bg-primary/10 text-primary" : undefined}>
                  미배정 {unassignedRows.length}
                </Badge>
              </div>
            </div>

            {unassignedRows.length ? (
              <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {unassignedRows.map((member) => (
                  <PlayerCard
                    key={member.id}
                    member={member}
                    saving={saving}
                    highlighted={highlightedMemberId === member.id}
                    onClick={() => !readOnly && setSelectedPlayer({ memberId: member.id, name: member.name, teamName: null })}
                    onDragStart={startDrag}
                    readOnly={readOnly}
                  />
                ))}
              </div>
            ) : (
              <EmptyState title="모든 참석자가 팀에 배정됐습니다." />
            )}
          </section>

          <section className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex flex-wrap items-center gap-2 text-sm font-black">
                <LayoutGrid className="h-4 w-4 text-accent" />
                팀 보드
                <Badge>{selectedGameDay?.mode === "TWO_WAY" ? "2파전" : "3파전"}</Badge>
                {!readOnly ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 border-primary/30 bg-primary/10 px-2.5 text-xs font-black text-primary hover:bg-primary/15"
                    disabled={saving || !teams.length}
                    onClick={() => setResetConfirmOpen(true)}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    초기화
                  </Button>
                ) : null}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5">
                <SortButton active={teamSortMode === "name"} icon="name" onClick={() => setTeamSortMode("name")}>
                  이름
                </SortButton>
                <SortButton
                  active={teamSortMode === "position"}
                  icon="position"
                  onClick={() => setTeamSortMode("position")}
                >
                  포지션
                </SortButton>
              </div>
            </div>

            <div className="grid gap-2 lg:grid-cols-3">
              {expectedTeamNames.map((teamName) => {
                const team = getTeam(teamName)

                return (
                  <article
                    key={teamName}
                    className={`min-h-40 rounded-md border p-3 transition-colors ${
                      dragOverTarget === teamName ? teamDropTone(teamName) : teamCardTone(teamName)
                    }`}
                    onDragOver={(event) => allowDrop(event, teamName)}
                    onDragLeave={() => setDragOverTarget(null)}
                    onDrop={(event) => dropMember(event, teamName)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <TeamLabel name={teamName} count={team?.members.length ?? 0} size="lg" />
                      </div>
                    </div>

                    {team?.members.length ? (
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {sortedTeamMembers(team).map((teamMember) => {
                          const member = teamMember.memberId ? memberById.get(teamMember.memberId) : null

                          return member ? (
                            <PlayerCard
                              key={teamMember.id}
                              member={member}
                              teamName={teamName}
                              compact
                              saving={saving}
                              highlighted={highlightedMemberId === member.id}
                              onClick={() => !readOnly && setSelectedPlayer({ memberId: member.id, name: member.name, teamName })}
                              onDragStart={startDrag}
                              readOnly={readOnly}
                            />
                          ) : (
                            <div key={teamMember.id} className={`rounded-md border px-2 py-1.5 text-xs ${teamMemberTone(teamName)}`}>
                              <p className="font-bold leading-none">
                                {teamMember.playerName}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <EmptyState title="아직 팀이 없습니다." />
                    )}

                  </article>
                )
              })}
            </div>
          </section>

          {loading ? <SkeletonRows /> : null}
        </CardContent>
      </Card>

      {selectedPlayer && !readOnly ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/50 px-4 backdrop-blur-[2px]" onClick={() => setSelectedPlayer(null)}>
          <section className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-black">{selectedPlayer.name}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">배정할 팀을 선택하세요</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-2.5"
                onClick={() => setSelectedPlayer(null)}
              >
                닫기
              </Button>
            </div>

            <div className="grid gap-2">
              {expectedTeamNames.map((teamName) => (
                <button
                  key={teamName}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-sm font-black transition-colors ${
                    selectedPlayer.teamName === teamName
                      ? "border-border bg-secondary text-muted-foreground"
                      : `${teamLabelTone(teamName)} hover:brightness-95`
                  }`}
                  type="button"
                  disabled={saving}
                  onClick={() => moveSelectedPlayer(teamName)}
                >
                  <span>{teamLabels[teamName]}</span>
                  {selectedPlayer.teamName === teamName ? <span className="text-xs font-semibold">현재</span> : null}
                </button>
              ))}
              <Button
                type="button"
                variant="outline"
                className="justify-between border-border bg-background/70 text-muted-foreground hover:bg-secondary hover:text-foreground"
                disabled={saving || selectedPlayer.teamName === null}
                onClick={() => moveSelectedPlayer(null)}
              >
                미배정
                {selectedPlayer.teamName === null ? <span className="text-xs font-semibold">현재</span> : null}
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {guestModalOpen && !readOnly ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/55 px-4 backdrop-blur-[2px]"
          onClick={() => {
            setGuestModalOpen(false)
            setGuestFormOpen(false)
          }}
        >
          <section className="w-full max-w-2xl rounded-lg border border-border bg-card p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-accent/30 bg-accent/10 text-accent">
                    <UserPlus className="h-4 w-4" />
                  </span>
                  <h3 className="text-lg font-black">게스트 조회</h3>
                </div>
                <p className="text-sm font-medium text-muted-foreground">등록된 게스트를 팀에 배정하거나 새 게스트를 추가합니다.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                title="닫기"
                onClick={() => {
                  setGuestModalOpen(false)
                  setGuestFormOpen(false)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className={`grid gap-4 ${guestFormOpen ? "lg:grid-cols-[1fr_0.9fr]" : ""}`}>
              <section className="space-y-2">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <TextInput label="게스트 검색" value={guestQuery} onChange={setGuestQuery} />
                  </div>
                  {!guestFormOpen ? (
                    <Button
                      type="button"
                      className="h-10 shrink-0 px-3"
                      onClick={() => {
                        setGuestFormError(null)
                        setGuestFormOpen(true)
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                      추가
                    </Button>
                  ) : null}
                </div>
                <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                  {filteredGuestMembers.length ? (
                    filteredGuestMembers.map((member) => {
                      const teamName = assignedPlayerByMemberId.get(member.id) ?? null

                      return (
                        <div
                          key={member.id}
                          className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-secondary"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            if (saving) return
                            setGuestModalOpen(false)
                            setSelectedPlayer({ memberId: member.id, name: member.name, teamName })
                          }}
                          onKeyDown={(event) => {
                            if (saving || (event.key !== "Enter" && event.key !== " ")) return
                            event.preventDefault()
                            setGuestModalOpen(false)
                            setSelectedPlayer({ memberId: member.id, name: member.name, teamName })
                          }}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-black">{member.name}</span>
                            <span className="mt-0.5 block truncate text-xs font-semibold text-muted-foreground">
                              {member.position || "포지션 미상"}
                              {member.height ? ` · ${member.height}cm` : ""}
                            </span>
                          </span>
                          <Badge className={teamName ? teamLabelTone(teamName) : "border-primary/30 bg-primary/10 text-primary"}>
                            {teamName ? teamLabels[teamName] : "미배정"}
                          </Badge>
                          <button
                            type="button"
                            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15"
                            title="게스트 삭제"
                            disabled={saving}
                            onClick={(event) => {
                              event.stopPropagation()
                              setDeleteGuestConfirm(member)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })
                  ) : (
                    <EmptyState title="등록된 게스트가 없습니다." />
                  )}
                </div>
              </section>

              {guestFormOpen ? (
                <form className="rounded-md border border-border bg-secondary/35 p-3" onSubmit={submitGuest}>
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-black">게스트 추가</h4>
                      <p className="mt-1 text-xs font-semibold text-muted-foreground">이름, 포지션, 키만 입력합니다.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      title="추가 취소"
                      onClick={() => {
                        setGuestForm(emptyGuestForm)
                        setGuestFormError(null)
                        setGuestFormOpen(false)
                      }}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid gap-2">
                    <TextInput label="이름" value={guestForm.name} onChange={(name) => setGuestForm((current) => ({ ...current, name }))} required />
                    <SelectInput
                      label="포지션"
                      value={guestForm.position}
                      options={guestPositionOptions}
                      onChange={(position) => setGuestForm((current) => ({ ...current, position }))}
                    />
                    <NumberInput label="키" value={guestForm.height} onChange={(height) => setGuestForm((current) => ({ ...current, height }))} />
                    {guestFormError ? <p className="text-xs font-semibold text-destructive">{guestFormError}</p> : null}
                    <Button type="submit" disabled={saving}>
                      <UserPlus className="h-4 w-4" />
                      추가
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {deleteGuestConfirm && !readOnly ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-background/60 px-4 backdrop-blur-[2px]" onClick={() => setDeleteGuestConfirm(null)}>
          <section className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black">게스트를 삭제할까요?</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                {deleteGuestConfirm.name} 게스트를 회원 목록에서 삭제합니다. 팀에 배정되어 있으면 먼저 팀에서 제외됩니다.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={async () => {
                  const deleted = await onDeleteGuest(deleteGuestConfirm)
                  if (deleted) {
                    setDeleteGuestConfirm(null)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
              <Button type="button" variant="outline" onClick={() => setDeleteGuestConfirm(null)}>
                취소
              </Button>
            </div>
          </section>
        </div>
      ) : null}

      {resetConfirmOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/55 px-4 backdrop-blur-[2px]" onClick={() => setResetConfirmOpen(false)}>
          <section className="w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-4">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <RotateCcw className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black">팀 배정을 초기화할까요?</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-muted-foreground">
                현재 블랙, 화이트, 레드에 배정된 모든 선수가 참석자 풀로 돌아갑니다.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                type="button"
                disabled={saving}
                onClick={() => {
                  setResetConfirmOpen(false)
                  onResetTeams()
                }}
              >
                <RotateCcw className="h-4 w-4" />
                초기화
              </Button>
              <Button type="button" variant="outline" onClick={() => setResetConfirmOpen(false)}>
                취소
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  )
}

function PlayerCard({
  member,
  teamName,
  compact = false,
  highlighted = false,
  saving,
  onClick,
  onDragStart,
  readOnly = false,
}: {
  member: Member
  teamName?: TeamName
  compact?: boolean
  highlighted?: boolean
  saving: boolean
  onClick: () => void
  onDragStart: (event: DragEvent<HTMLElement>, memberId: number) => void
  readOnly?: boolean
}) {
  const interactiveClass = readOnly || saving ? "opacity-80" : "cursor-grab active:cursor-grabbing"

  if (compact) {
    const toneClass = playerCardTone(member, teamName)

    return (
      <div
        className={`flex max-w-full items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-sm ${
          toneClass
        } ${highlighted ? "team-move-flash" : ""} ${interactiveClass}`}
        draggable={!saving && !readOnly}
        role="button"
        tabIndex={0}
        onClick={readOnly ? undefined : onClick}
        onDragStart={(event) => onDragStart(event, member.id)}
      >
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="min-w-0 truncate font-bold leading-tight">{member.name}</p>
            {member.status === "GUEST" ? <GuestChip /> : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {member.position || "포지션 미상"}
            {member.height ? ` · ${member.height}cm` : ""}
          </p>
        </div>
      </div>
    )
  }

  const toneClass = playerCardTone(member, teamName)

  return (
    <div
      className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition hover:-translate-y-0.5 hover:shadow-sm ${
        toneClass
      } ${highlighted ? "team-move-flash" : ""} ${interactiveClass}`}
      draggable={!saving && !readOnly}
      role="button"
      tabIndex={0}
      onClick={readOnly ? undefined : onClick}
      onDragStart={(event) => onDragStart(event, member.id)}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className="min-w-0 truncate font-bold">{member.name}</p>
          {member.status === "GUEST" ? <GuestChip /> : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {member.position || "포지션 미상"}
          {member.height ? ` · ${member.height}cm` : ""}
        </p>
      </div>
    </div>
  )
}

function playerCardTone(member: Member, teamName?: TeamName) {
  if (member.status === "GUEST") {
    return "border-emerald-500/45 bg-emerald-500/10"
  }

  return teamName ? teamMemberTone(teamName) : "border-border bg-card"
}

function GuestChip() {
  return (
    <span className="shrink-0 rounded border border-emerald-500/45 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-black leading-none text-emerald-700">
      게스트
    </span>
  )
}

function TeamLabel({ name, count, size = "md" }: { name: TeamName; count?: number; size?: "md" | "lg" }) {
  const sizeClass = size === "lg" ? "px-3 py-1.5 text-base" : "px-2 py-1 text-xs"

  return (
    <span className={`inline-flex items-center gap-2 rounded-md border font-black leading-none ${sizeClass} ${teamLabelTone(name)}`}>
      {teamLabels[name]}
      {typeof count === "number" ? (
        <span className="rounded bg-background/80 px-1.5 py-0.5 text-[11px] leading-none text-foreground">
          {count}
        </span>
      ) : null}
    </span>
  )
}

function SortButton({
  active,
  icon,
  children,
  onClick,
}: {
  active: boolean
  icon?: "name" | "position"
  children: string
  onClick: () => void
}) {
  const Icon = icon === "name" ? ArrowDownAZ : icon === "position" ? ListFilter : null

  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      className={active ? "h-8 px-2.5" : "h-8 border-border bg-background/70 px-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground"}
      onClick={onClick}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </Button>
  )
}

function positionRank(position: string | null | undefined) {
  if (!position) {
    return 99
  }

  if (position.includes("가드")) {
    return 1
  }

  if (position.includes("포워드")) {
    return 2
  }

  if (position.includes("센터")) {
    return 3
  }

  return 50
}

function compareParticipants(left: Member, right: Member) {
  const statusOrder = participantStatusRank(left) - participantStatusRank(right)

  if (statusOrder !== 0) {
    return statusOrder
  }

  return left.name.localeCompare(right.name, "ko-KR")
}

function participantStatusRank(member: Member | null | undefined) {
  return member?.status === "GUEST" ? 1 : 0
}

function teamLabelTone(name: TeamName) {
  return {
    BLACK: "border-zinc-900 bg-zinc-950 text-white",
    RED: "border-red-700 bg-red-600 text-white",
    WHITE: "border-zinc-300 bg-white text-zinc-900 shadow-sm",
  }[name]
}

function teamCardTone(name: TeamName) {
  return {
    BLACK: "border-zinc-900/40 bg-zinc-950/[0.035]",
    RED: "border-red-600/45 bg-red-600/[0.035]",
    WHITE: "border-zinc-300 bg-white/55",
  }[name]
}

function teamDropTone(name: TeamName) {
  return {
    BLACK: "border-zinc-950 bg-zinc-950/10",
    RED: "border-red-600 bg-red-50",
    WHITE: "border-zinc-400 bg-white",
  }[name]
}

function teamMemberTone(name: TeamName) {
  return {
    BLACK: "border-zinc-900/10 bg-zinc-50/80",
    RED: "border-red-600/25 bg-red-600/[0.025]",
    WHITE: "border-zinc-200 bg-zinc-50/70",
  }[name]
}
