import { useEffect, useState, type FormEvent } from "react"
import { ClipboardCheck, Pencil, Plus, Settings } from "lucide-react"

import { EmptyState, FormModal, SelectInput, SkeletonRows, StatBox, TextArea, TextInput, formatDate } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getGameModeRecommendation } from "@/lib/game-mode-recommendation"
import { attendanceStatusLabels } from "@/lib/labels"
import type { AttendanceStatus, AttendanceSummary, AttendanceVote, AttendanceVoteRequest, GameDay, Member } from "@/types/api"

export function AttendanceView({
  gameDays,
  members,
  votes,
  summary,
  selectedGameDayId,
  form,
  editingVoteId,
  loading,
  saving,
  onSelectGameDay,
  onChange,
  onSubmit,
  onEdit,
  onCancelEdit,
  onDelete,
  onEditGameDay,
  readOnly = false,
}: {
  gameDays: GameDay[]
  members: Member[]
  votes: AttendanceVote[]
  summary: AttendanceSummary | null
  selectedGameDayId: number
  form: AttendanceVoteRequest
  editingVoteId: number | null
  loading: boolean
  saving: boolean
  onSelectGameDay: (gameDayId: number) => void
  onChange: (value: AttendanceVoteRequest) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEdit: (vote: AttendanceVote) => void
  onCancelEdit: () => void
  onDelete: (id: number) => void
  onEditGameDay: () => void
  readOnly?: boolean
}) {
  const [formOpen, setFormOpen] = useState(false)
  const [wasSaving, setWasSaving] = useState(false)
  const selectedGameDay = gameDays.find((gameDay) => gameDay.id === selectedGameDayId)
  const scheduledGameDays = gameDays.filter((gameDay) => gameDay.status === "SCHEDULED")
  const votingEnabled = selectedGameDay?.status === "SCHEDULED"
  const otherVotes = votes.filter((vote) => vote.id !== editingVoteId)
  const votedMemberIds = new Set(otherVotes.flatMap((vote) => (vote.memberId ? [vote.memberId] : [])))
  const guestName = form.voterName.trim()
  const duplicateMember = form.memberId !== null && votedMemberIds.has(form.memberId)
  const duplicateGuest =
    form.memberId === null &&
    guestName.length > 0 &&
    otherVotes.some((vote) => vote.memberId === null && vote.voterName.trim().toLowerCase() === guestName.toLowerCase())
  const duplicated = duplicateMember || duplicateGuest
  const editing = editingVoteId !== null
  const recommendation = getGameModeRecommendation(summary?.attendingCount ?? 0)
  const recommendationClass = {
    blue: "border-accent/40 bg-accent/10 text-accent",
    sky: "border-sky-500/30 bg-sky-500/10 text-sky-800",
    slate: "border-slate-500/30 bg-slate-500/10 text-slate-700",
  }[recommendation.tone]

  useEffect(() => {
    if (editing) {
      setFormOpen(true)
    }
  }, [editing])

  useEffect(() => {
    if (wasSaving && !saving && !form.voterName.trim() && !form.memberId && !editing) {
      setFormOpen(false)
    }
    setWasSaving(saving)
  }, [editing, form.memberId, form.voterName, saving, wasSaving])

  function openCreateForm() {
    if (!votingEnabled || readOnly) {
      return
    }

    onCancelEdit()
    setFormOpen(true)
  }

  function closeForm() {
    onCancelEdit()
    setFormOpen(false)
  }

  function editVote(vote: AttendanceVote) {
    if (!votingEnabled || readOnly) {
      return
    }

    onEdit(vote)
    setFormOpen(true)
  }

  return (
    <section className="space-y-4">
      {formOpen ? (
        <FormModal
          title={
            <>
              {editing ? <Pencil className="h-5 w-5 text-accent" /> : <ClipboardCheck className="h-5 w-5 text-accent" />}
              {editing ? "참석 투표 수정" : "참석 투표 등록"}
            </>
          }
          onClose={closeForm}
        >
          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">경기</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={selectedGameDayId || ""}
                onChange={(event) => onSelectGameDay(Number(event.target.value))}
                required
              >
                <option value="" disabled>
                  경기 선택
                </option>
                {scheduledGameDays.map((gameDay) => (
                  <option key={gameDay.id} value={gameDay.id}>
                    {gameDay.gameDate}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">회원</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={form.memberId ?? ""}
                onChange={(event) =>
                  onChange({
                    ...form,
                    memberId: event.target.value ? Number(event.target.value) : null,
                    voterName: event.target.value ? "" : form.voterName,
                  })
                }
              >
                <option value="">게스트 / 직접 입력</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id} disabled={votedMemberIds.has(member.id)}>
                    {member.name}
                    {votedMemberIds.has(member.id) ? " (투표 완료)" : ""}
                  </option>
                ))}
              </select>
            </label>

            <TextInput
              label="게스트 이름"
              value={form.voterName}
              onChange={(voterName) => onChange({ ...form, voterName, memberId: null })}
            />
            {duplicated ? (
              <p className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm font-semibold text-primary">
                이미 이 경기 참석 투표에 등록되어 있습니다.
              </p>
            ) : null}
            <SelectInput
              label="상태"
              value={form.status}
              options={attendanceStatusLabels}
              onChange={(status) => onChange({ ...form, status: status as AttendanceStatus })}
            />
            <TextArea label="메모" value={form.memo} onChange={(memo) => onChange({ ...form, memo })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                취소
              </Button>
              <Button disabled={saving || duplicated || !selectedGameDayId || (!form.memberId && !form.voterName.trim())}>
                {editing ? <Pencil className="h-4 w-4" /> : <ClipboardCheck className="h-4 w-4" />}
                {saving ? "저장 중" : editing ? "투표 수정" : "투표 등록"}
              </Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-accent" />
              참석 투표 목록
            </CardTitle>
            <div className="flex items-center gap-2">
              {selectedGameDay ? <Badge>{formatDate(selectedGameDay.gameDate)}</Badge> : null}
              {!readOnly ? (
                <Button type="button" size="sm" onClick={openCreateForm} disabled={!votingEnabled}>
                  <Plus className="h-4 w-4" />
                  투표 등록
                </Button>
              ) : (
                <Badge className="border-amber-500/35 bg-amber-500/10 text-amber-700">조회 전용</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted-foreground">참석 투표할 경기</span>
            <select
              className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              value={selectedGameDayId || ""}
              onChange={(event) => onSelectGameDay(Number(event.target.value))}
              disabled={!scheduledGameDays.length}
            >
              <option value="" disabled>
                예정 경기 없음
              </option>
              {scheduledGameDays.map((gameDay) => (
                <option key={gameDay.id} value={gameDay.id}>
                  {gameDay.gameDate}
                </option>
              ))}
            </select>
          </label>
          {!scheduledGameDays.length ? <EmptyState title="참석 투표를 열 수 있는 예정 경기가 없습니다." /> : null}
          <div className="grid grid-cols-4 gap-2">
            <StatBox label="참석" value={summary?.attendingCount ?? 0} tone="blue" />
            <StatBox label="불참" value={summary?.absentCount ?? 0} tone="slate" />
            <StatBox label="미정" value={summary?.undecidedCount ?? 0} tone="sky" />
            <StatBox label="전체" value={summary?.totalCount ?? 0} tone="blue" />
          </div>
          <div className={`rounded-md border p-4 ${recommendationClass}`}>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-lg font-black">{recommendation.label}</p>
              <p className="text-sm font-semibold">{summary?.attendingCount ?? 0}명 참석 기준</p>
            </div>
            <p className="mt-1 text-sm">{recommendation.description}</p>
            {selectedGameDay && !readOnly ? (
              <Button className="mt-3" type="button" variant="outline" size="sm" onClick={onEditGameDay}>
                <Settings className="h-4 w-4" />
                경기 방식 수정
              </Button>
            ) : null}
          </div>

          {loading ? (
            <SkeletonRows />
          ) : votes.length ? (
            <div className="space-y-3">
              {votes.map((vote) => (
                <article key={vote.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 p-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-black">{vote.voterName}</h2>
                    {vote.memo ? <p className="mt-1 truncate text-sm text-muted-foreground">{vote.memo}</p> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge>{attendanceStatusLabels[vote.status]}</Badge>
                    {!readOnly ? (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => editVote(vote)} disabled={!votingEnabled}>
                          수정
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => onDelete(vote.id)} disabled={!votingEnabled}>
                          삭제
                        </Button>
                      </>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState title="등록된 참석 투표가 없습니다." />
          )}
        </CardContent>
      </Card>
    </section>
  )
}
