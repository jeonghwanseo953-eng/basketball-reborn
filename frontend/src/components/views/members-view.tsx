import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react"
import {
  ArrowDown,
  ArrowUp,
  Camera,
  CalendarPlus,
  Crown,
  Landmark,
  Pencil,
  Ruler,
  Search,
  Shield,
  StickyNote,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  UsersRound,
  X,
} from "lucide-react"

import { EmptyState, NumberInput, SelectInput, SkeletonRows, TextArea, TextInput } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { memberRoleLabels, memberStatusLabels } from "@/lib/labels"
import type { Member, MemberRequest, MemberRole, MemberStatus } from "@/types/api"

type MemberSortKey = "name" | "role" | "status" | "birthYear" | "height" | "position" | "region"
type SortDirection = "asc" | "desc"

const positionOptions = ["가드", "포워드", "센터"] as const

export function MembersView({
  members,
  form,
  editingMemberId,
  loading,
  saving,
  roleHolders,
  currentMemberId,
  onChange,
  onSubmit,
  onEdit,
  onCancelEdit,
  onDelete,
  onProfileImageUpdate,
  readOnly = false,
}: {
  members: Member[]
  form: MemberRequest
  editingMemberId: number | null
  loading: boolean
  saving: boolean
  roleHolders: Member[]
  currentMemberId: number | null
  onChange: (value: MemberRequest) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEdit: (member: Member) => void
  onCancelEdit: () => void
  onDelete: (id: number) => void
  onProfileImageUpdate: (memberId: number, profileImageUrl: string) => Promise<void>
  readOnly?: boolean
}) {
  const editing = editingMemberId !== null
  const [formOpen, setFormOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [wasSaving, setWasSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<MemberStatus | "ALL">("ALL")
  const [showInactiveMembers, setShowInactiveMembers] = useState(false)
  const [sortKey, setSortKey] = useState<MemberSortKey>("name")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const counts = useMemo(() => {
    return members.reduce(
      (acc, member) => {
        acc.total += 1
        acc[member.status] += 1
        return acc
      },
      { total: 0, REGULAR: 0, GUEST: 0, RESTING: 0, WITHDRAWN: 0 } as Record<MemberStatus | "total", number>,
    )
  }, [members])

  const displayedMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    const filtered = members.filter((member) => {
      const matchesInactiveVisibility = showInactiveMembers || (member.status !== "GUEST" && member.status !== "WITHDRAWN")
      const matchesStatus = statusFilter === "ALL" || member.status === statusFilter
      const searchableText = [member.name, member.position, member.region, member.memo]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery)

      return matchesInactiveVisibility && matchesStatus && matchesQuery
    })

    return [...filtered].sort((left, right) => compareMembers(left, right, sortKey, sortDirection))
  }, [members, query, showInactiveMembers, sortDirection, sortKey, statusFilter])

  useEffect(() => {
    if (editing) {
      setFormOpen(true)
    }
  }, [editing])

  useEffect(() => {
    if ((statusFilter === "GUEST" || statusFilter === "WITHDRAWN") && !showInactiveMembers) {
      setStatusFilter("ALL")
    }
  }, [showInactiveMembers, statusFilter])

  useEffect(() => {
    if (wasSaving && !saving && !form.name.trim() && !editing) {
      setFormOpen(false)
    }
    setWasSaving(saving)
  }, [editing, form.name, saving, wasSaving])

  function openCreateForm() {
    if (readOnly) return
    onCancelEdit()
    setFormOpen(true)
  }

  function closeForm() {
    onCancelEdit()
    setFormOpen(false)
  }

  function editMember(member: Member) {
    if (readOnly) return
    setSelectedMember(null)
    onEdit(member)
    setFormOpen(true)
  }

  function closeProfile() {
    setSelectedMember(null)
  }

  function deleteFromProfile(member: Member) {
    if (readOnly) return
    onDelete(member.id)
    setSelectedMember(null)
  }

  async function updateProfileImage(member: Member, profileImageUrl: string) {
    await onProfileImageUpdate(member.id, profileImageUrl)
    setSelectedMember({ ...member, profileImageUrl })
  }

  function selectStatusFilter(status: MemberStatus | "ALL") {
    if ((status === "GUEST" || status === "WITHDRAWN") && !showInactiveMembers) {
      setShowInactiveMembers(true)
    }

    setStatusFilter(status)
  }

  function changeSort(nextSortKey: MemberSortKey) {
    if (sortKey === nextSortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
      return
    }

    setSortKey(nextSortKey)
    setSortDirection("asc")
  }

  function renderSortHeader(label: string, nextSortKey: MemberSortKey) {
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
        <div className="modal-overlay fixed inset-0 z-50 flex items-start justify-center bg-background/80 px-4 py-6 backdrop-blur-sm sm:items-center">
          <Card className="modal-panel max-h-[calc(100vh-48px)] w-full max-w-xl overflow-y-auto shadow-2xl">
            <CardHeader className="border-b border-border bg-secondary/30 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {editing ? <Pencil className="h-5 w-5 text-accent" /> : <UserPlus className="h-5 w-5 text-accent" />}
                    {editing ? "회원 수정" : "회원 등록"}
                  </CardTitle>
                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {form.name.trim() || "새 회원"} · {memberStatusLabels[form.status]}
                  </p>
                </div>
                <Button className="h-8 w-8" type="button" variant="outline" size="icon" title="닫기" onClick={closeForm}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <form className="space-y-3" onSubmit={onSubmit}>
                <FormSection icon={UserRound} title="기본 정보">
                  <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr]">
                    <TextInput label="이름" value={form.name} onChange={(name) => onChange({ ...form, name })} required />
                    <NumberInput label="출생년도" value={form.birthYear} onChange={(birthYear) => onChange({ ...form, birthYear })} />
                  </div>
                </FormSection>

                <FormSection icon={Ruler} title="신체·활동 정보">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <NumberInput label="키" value={form.height} onChange={(height) => onChange({ ...form, height })} />
                    <div className="sm:col-span-2">
                      <PositionPicker value={form.position} onChange={(position) => onChange({ ...form, position })} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <TextInput label="지역" value={form.region} onChange={(region) => onChange({ ...form, region })} />
                  </div>
                </FormSection>

                <FormSection icon={Shield} title="운영 정보">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <RoleSelect
                      currentMemberId={editingMemberId}
                      roleHolders={roleHolders}
                      value={form.role}
                      onChange={(role) => onChange({ ...form, role })}
                    />
                    <SelectInput
                      label="상태"
                      value={form.status}
                      options={memberStatusLabels}
                      onChange={(status) =>
                        onChange({
                          ...form,
                          status: status as MemberStatus,
                          restUntilDate: status === "RESTING" ? form.restUntilDate : null,
                        })
                      }
                    />
                  </div>
                  {form.status === "RESTING" ? (
                    <div className="mt-3">
                      <TextInput
                        label="휴식 종료일"
                        type="date"
                        value={form.restUntilDate ?? ""}
                        onChange={(restUntilDate) => onChange({ ...form, restUntilDate: restUntilDate || null })}
                      />
                    </div>
                  ) : null}
                </FormSection>

                <FormSection icon={StickyNote} title="메모">
                  <TextArea label="메모" value={form.memo} onChange={(memo) => onChange({ ...form, memo })} />
                </FormSection>

                <div className="flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={closeForm}>
                    취소
                  </Button>
                  <Button className="sm:min-w-32" disabled={saving || !form.name.trim()}>
                    {editing ? <Pencil className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    {saving ? "저장 중" : editing ? "수정 완료" : "회원 등록"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {selectedMember ? (
        <MemberProfileModal
          member={selectedMember}
          onClose={closeProfile}
          onEdit={editMember}
          onDelete={deleteFromProfile}
          onProfileImageUpdate={updateProfileImage}
          canEditProfileImage={!readOnly && selectedMember.kakaoLinked && selectedMember.id === currentMemberId}
          readOnly={readOnly}
        />
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersRound className="h-5 w-5 text-accent" />
              회원 목록
            </CardTitle>
            {readOnly ? (
              <Badge className="border-amber-500/35 bg-amber-500/10 text-amber-700">조회 전용</Badge>
            ) : (
              <Button type="button" size="sm" onClick={openCreateForm}>
                <UserPlus className="h-4 w-4" />
                회원 등록
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:flex sm:flex-wrap">
              <MemberCount
                active={statusFilter === "ALL"}
                label="전체"
                value={showInactiveMembers ? counts.total : counts.total - counts.GUEST - counts.WITHDRAWN}
                onClick={() => selectStatusFilter("ALL")}
              />
              <MemberCount active={statusFilter === "REGULAR"} label="정회원" value={counts.REGULAR} onClick={() => selectStatusFilter("REGULAR")} />
              <MemberCount active={statusFilter === "RESTING"} label="휴식" value={counts.RESTING} onClick={() => selectStatusFilter("RESTING")} />
              <MemberCount
                active={statusFilter === "WITHDRAWN"}
                label="탈퇴"
                value={counts.WITHDRAWN}
                muted={!showInactiveMembers}
                onClick={() => selectStatusFilter("WITHDRAWN")}
              />
              <MemberCount
                active={statusFilter === "GUEST"}
                label="게스트"
                value={counts.GUEST}
                muted={!showInactiveMembers}
                onClick={() => selectStatusFilter("GUEST")}
              />
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="relative">
              <TextInput label="이름·지역·메모 검색" value={query} onChange={setQuery} />
              <Search className="pointer-events-none absolute bottom-2.5 right-3 h-4 w-4 text-muted-foreground" />
            </div>
            <label className="flex h-10 items-center gap-2 rounded-md border border-border bg-secondary/50 px-3 text-sm font-semibold text-foreground">
              <input
                className="h-4 w-4 accent-[hsl(var(--primary))]"
                type="checkbox"
                checked={showInactiveMembers}
                onChange={(event) => setShowInactiveMembers(event.target.checked)}
              />
              게스트/탈퇴 보기
            </label>
          </div>

          {loading ? (
            <SkeletonRows />
          ) : displayedMembers.length ? (
            <>
              <div className="block lg:hidden">
                <div className="grid gap-3">
                  {displayedMembers.map((member) => (
                    <MemberCard
                      key={member.id}
                      member={member}
                      onOpen={setSelectedMember}
                    />
                  ))}
                </div>
              </div>

              <div className="hidden overflow-x-auto rounded-md border border-border lg:block">
                <table className="w-full min-w-[880px] table-fixed border-collapse text-sm">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[9%]" />
                    <col className="w-[8%]" />
                    <col className="w-[11%]" />
                    <col className="w-[12%]" />
                    <col className="w-[10%]" />
                    <col className="w-[28%]" />
                  </colgroup>
                  <thead className="bg-secondary text-left text-xs font-semibold text-muted-foreground">
                    <tr>
                      <th className="border-b border-border px-3 py-2">{renderSortHeader("이름", "name")}</th>
                      <th className="border-b border-border px-3 py-2">{renderSortHeader("출생", "birthYear")}</th>
                      <th className="border-b border-border px-3 py-2">{renderSortHeader("키", "height")}</th>
                      <th className="border-b border-border px-3 py-2">{renderSortHeader("포지션", "position")}</th>
                      <th className="border-b border-border px-3 py-2">{renderSortHeader("지역", "region")}</th>
                      <th className="border-b border-border px-3 py-2">{renderSortHeader("상태", "status")}</th>
                      <th className="border-b border-border px-3 py-2">메모</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="cursor-pointer border-b border-border bg-secondary/20 transition-colors last:border-b-0 hover:bg-secondary/50 focus-within:bg-secondary/50"
                        onClick={() => setSelectedMember(member)}
                      >
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <button
                              className="min-w-12 truncate text-left font-bold text-foreground outline-none"
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setSelectedMember(member)
                              }}
                            >
                              {member.name}
                            </button>
                            {renderRole(member)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{formatBirthYear(member.birthYear)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{member.height ? `${member.height}cm` : "-"}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{member.position || "-"}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-muted-foreground">{member.region || "-"}</td>
                        <td className="whitespace-nowrap px-3 py-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <StatusBadge status={member.status} />
                            <GuestCreatedBadge member={member} />
                          </div>
                        </td>
                        <td className="max-w-64 truncate px-3 py-2 text-muted-foreground">{member.memo || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <EmptyState title="조건에 맞는 회원이 없습니다." />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function MemberProfileModal({
  member,
  onClose,
  onEdit,
  onDelete,
  onProfileImageUpdate,
  canEditProfileImage,
  readOnly = false,
}: {
  member: Member
  onClose: () => void
  onEdit: (member: Member) => void
  onDelete: (member: Member) => void
  onProfileImageUpdate: (member: Member, profileImageUrl: string) => Promise<void>
  canEditProfileImage: boolean
  readOnly?: boolean
}) {
  const [imageEditorOpen, setImageEditorOpen] = useState(false)

  return (
    <div className="modal-overlay fixed inset-0 z-50 flex items-start justify-center bg-background/80 px-4 py-6 backdrop-blur-sm sm:items-center">
      <Card className="modal-panel max-h-[calc(100vh-48px)] w-full max-w-lg overflow-y-auto shadow-2xl">
        <CardHeader className="border-b border-border bg-secondary/30 px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <ProfileAvatar member={member} size="md" />
              <div className="min-w-0">
                <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                  {member.name}
                  {renderRole(member)}
                </CardTitle>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <StatusBadge status={member.status} />
                  <GuestCreatedBadge member={member} />
                  <Badge
                    className={
                      member.kakaoLinked
                        ? "gap-1 border-[#f2d500] bg-[#fee500] text-slate-950"
                        : "border-border bg-secondary text-muted-foreground"
                    }
                  >
                    {member.kakaoLinked ? <KakaoTalkIcon /> : null}
                    {member.kakaoLinked ? "카카오 연동" : "카카오 미연동"}
                  </Badge>
                  {member.status === "RESTING" ? <RestUntilBadge value={member.restUntilDate} /> : null}
                </div>
              </div>
            </div>
            <Button className="h-8 w-8 shrink-0" type="button" variant="outline" size="icon" title="닫기" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4">
          <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <ProfileItem label="출생" value={formatBirthYear(member.birthYear)} />
            <ProfileItem label="키" value={member.height ? `${member.height}cm` : "-"} />
            <ProfileItem label="포지션" value={member.position || "-"} />
            <ProfileItem label="지역" value={member.region || "-"} />
            {member.status === "GUEST" ? <ProfileItem label="등록일" value={formatShortDate(member.createdAt)} /> : null}
          </dl>

          {member.memo ? (
            <section className="rounded-md border border-border bg-secondary/20 p-3">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-black">
                <StickyNote className="h-4 w-4 text-accent" />
                메모
              </h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{member.memo}</p>
            </section>
          ) : null}

          {canEditProfileImage ? (
            <section className="rounded-md border border-border bg-secondary/20 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2 text-sm font-black">
                    <Camera className="h-4 w-4 text-accent" />
                    프로필 사진
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-muted-foreground">사진을 직접 등록하고 크기를 조절할 수 있습니다.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setImageEditorOpen(true)}>
                  <Upload className="h-4 w-4" />
                  등록
                </Button>
              </div>
            </section>
          ) : null}

          {!readOnly ? (
            <div className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end">
              <Button type="button" onClick={() => onEdit(member)}>
                <Pencil className="h-4 w-4" />
                수정
              </Button>
              <Button type="button" variant="outline" onClick={() => onDelete(member)}>
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
      {imageEditorOpen ? (
        <ProfileImageEditor
          member={member}
          onClose={() => setImageEditorOpen(false)}
          onSave={async (profileImageUrl) => {
            await onProfileImageUpdate(member, profileImageUrl)
            setImageEditorOpen(false)
          }}
        />
      ) : null}
    </div>
  )
}

function ProfileAvatar({ member, size = "sm" }: { member: Member; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "h-12 w-12 text-lg" : "h-10 w-10 text-base"

  if (member.profileImageUrl) {
    return (
      <img
        className={`${sizeClass} shrink-0 rounded-md border border-border object-cover`}
        src={member.profileImageUrl}
        alt={`${member.name} 프로필`}
      />
    )
  }

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center rounded-md bg-primary font-black text-primary-foreground`}>
      {member.name.slice(0, 1)}
    </div>
  )
}

function ProfileImageEditor({
  member,
  onClose,
  onSave,
}: {
  member: Member
  onClose: () => void
  onSave: (profileImageUrl: string) => Promise<void>
}) {
  const [imageSrc, setImageSrc] = useState(member.profileImageUrl ?? "")
  const [zoom, setZoom] = useState(1)
  const [saving, setSaving] = useState(false)

  function selectFile(file: File | undefined) {
    if (!file) {
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageSrc(typeof reader.result === "string" ? reader.result : "")
      setZoom(1)
    }
    reader.readAsDataURL(file)
  }

  async function saveImage() {
    if (!imageSrc) {
      return
    }

    setSaving(true)
    try {
      await onSave(await renderSquareImage(imageSrc, zoom))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/70 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-4 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">프로필 사진 등록</h3>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">{member.name}님의 사진을 조절합니다.</p>
          </div>
          <Button className="h-9 w-9" type="button" variant="outline" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <label className="mb-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border bg-secondary/35 px-3 py-3 text-sm font-black text-muted-foreground hover:bg-secondary">
          <Upload className="h-4 w-4" />
          사진 선택
          <input className="hidden" type="file" accept="image/*" onChange={(event) => selectFile(event.target.files?.[0])} />
        </label>

        <div className="mx-auto mb-4 h-56 w-56 overflow-hidden rounded-lg border border-border bg-secondary">
          {imageSrc ? (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${imageSrc})`, backgroundSize: `${zoom * 100}%` }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">사진을 선택하세요</div>
          )}
        </div>

        <label className="block">
          <span className="text-xs font-black text-muted-foreground">크기 조절</span>
          <input
            className="mt-2 w-full accent-[hsl(var(--primary))]"
            type="range"
            min="1"
            max="2"
            step="0.01"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            disabled={!imageSrc}
          />
        </label>

        <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button type="button" disabled={!imageSrc || saving} onClick={() => void saveImage()}>
            {saving ? "저장 중" : "저장"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function renderSquareImage(src: string, zoom: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const size = 320
      const canvas = document.createElement("canvas")
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext("2d")
      if (!context) {
        reject(new Error("Canvas is not supported"))
        return
      }

      const coverScale = Math.max(size / image.width, size / image.height) * zoom
      const width = image.width * coverScale
      const height = image.height * coverScale
      context.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
      resolve(canvas.toDataURL("image/jpeg", 0.86))
    }
    image.onerror = () => reject(new Error("Image could not be loaded"))
    image.src = src
  })
}

function KakaoTalkIcon() {
  return (
    <span className="relative inline-flex h-3.5 w-4 shrink-0 items-center justify-center rounded-[6px] bg-slate-950/75">
      <span className="h-1 w-2 rounded-full border border-[#fee500]/90" />
      <span className="absolute -bottom-[2px] left-1.5 h-1.5 w-1.5 rotate-45 rounded-[1px] bg-slate-950/75" />
    </span>
  )
}

function ProfileItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/40 p-3 text-center">
      <dt className="text-xs font-semibold text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-bold text-foreground">{value}</dd>
    </div>
  )
}

function RestUntilBadge({ value }: { value: string | null }) {
  return <Badge className="border-amber-500/40 bg-amber-500/10 text-amber-700">휴식 ~ {formatDateValue(value)}</Badge>
}

function PositionPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const selectedPosition = normalizePosition(value)

  function selectPosition(position: string) {
    onChange(selectedPosition === position ? "" : position)
  }

  return (
    <fieldset>
      <legend className="mb-1 block text-xs font-semibold text-muted-foreground">포지션</legend>
      <div className="grid grid-cols-3 gap-1.5">
        {positionOptions.map((position) => {
          const active = selectedPosition === position

          return (
            <button
              key={position}
              className={`h-10 rounded-md border px-2 text-sm font-black transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-secondary text-muted-foreground hover:bg-card hover:text-foreground"
              }`}
              type="button"
              aria-pressed={active}
              onClick={() => selectPosition(position)}
            >
              {position}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function RoleSelect({
  currentMemberId,
  roleHolders,
  value,
  onChange,
}: {
  currentMemberId: number | null
  roleHolders: Member[]
  value: MemberRole
  onChange: (value: MemberRole) => void
}) {
  const president = getRoleHolder(roleHolders, "PRESIDENT", currentMemberId)
  const treasurer = getRoleHolder(roleHolders, "TREASURER", currentMemberId)

  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">직책</span>
      <select
        className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value as MemberRole)}
      >
        <option value="NONE">{memberRoleLabels.NONE}</option>
        <option value="PRESIDENT" disabled={Boolean(president)}>
          {president ? `회장 (${president.name})` : memberRoleLabels.PRESIDENT}
        </option>
        <option value="TREASURER" disabled={Boolean(treasurer)}>
          {treasurer ? `총무 (${treasurer.name})` : memberRoleLabels.TREASURER}
        </option>
      </select>
      {president || treasurer ? (
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          {[
            president ? `회장: ${president.name}` : null,
            treasurer ? `총무: ${treasurer.name}` : null,
          ].filter(Boolean).join(" · ")}
        </p>
      ) : null}
    </label>
  )
}

function getRoleHolder(roleHolders: Member[], role: MemberRole, currentMemberId: number | null) {
  return roleHolders.find((member) => member.role === role && member.id !== currentMemberId) ?? null
}

function normalizePosition(value: string) {
  const normalized = value.toUpperCase().replace(/\s/g, "")

  if (!normalized) {
    return ""
  }

  if (value.includes("가드") || normalized.includes("PG") || normalized.includes("SG") || normalized === "G") {
    return "가드"
  }

  if (value.includes("포워드") || normalized.includes("SF") || normalized.includes("PF") || normalized === "F") {
    return "포워드"
  }

  if (value.includes("센터") || normalized.includes("C")) {
    return "센터"
  }

  return ""
}

function FormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof UserRound
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

function MemberCount({
  label,
  value,
  active = false,
  muted = false,
  onClick,
}: {
  label: string
  value: number
  active?: boolean
  muted?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={`flex min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left transition-colors sm:min-w-24 sm:gap-3 ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-secondary/40 text-foreground hover:bg-secondary"
      } ${muted ? "opacity-60" : ""}`}
      type="button"
      onClick={onClick}
    >
      <span className={`text-xs font-semibold ${active ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</span>
      <span className={`text-lg font-black leading-none ${active ? "text-primary-foreground" : "text-foreground"}`}>{value}</span>
    </button>
  )
}

function MemberCard({
  member,
  onOpen,
}: {
  member: Member
  onOpen: (member: Member) => void
}) {
  return (
    <article
      className="cursor-pointer rounded-md border border-border bg-secondary/30 p-4 transition-colors hover:bg-secondary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      role="button"
      tabIndex={0}
      onClick={() => onOpen(member)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(member)
        }
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3 text-left">
          <ProfileAvatar member={member} />
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black underline-offset-4 hover:text-accent hover:underline">{member.name}</h2>
            <StatusBadge status={member.status} />
            <GuestCreatedBadge member={member} />
            {renderRole(member)}
          </div>
        </div>
      </div>

      {member.memo ? <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{member.memo}</p> : null}

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <MemberDetail label="포지션" value={member.position} />
        <MemberDetail label="지역" value={member.region} />
        <MemberDetail label="키" value={member.height ? `${member.height}cm` : null} />
        <MemberDetail label="출생" value={formatBirthYear(member.birthYear)} />
      </dl>
    </article>
  )
}

function MemberDetail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted-foreground/70">{label}</dt>
      <dd className="font-semibold text-foreground">{value || "-"}</dd>
    </div>
  )
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const tone = {
    REGULAR: "border-accent/40 bg-accent/10 text-accent",
    GUEST: "border-slate-400/50 bg-slate-500/10 text-slate-600",
    RESTING: "border-amber-500/40 bg-amber-500/10 text-amber-700",
    WITHDRAWN: "border-destructive/40 bg-destructive/10 text-destructive",
  }[status]

  return <Badge className={tone}>{memberStatusLabels[status]}</Badge>
}

function GuestCreatedBadge({ member }: { member: Member }) {
  if (member.status !== "GUEST") {
    return null
  }

  return (
    <Badge className="gap-1 border-slate-300 bg-white text-slate-600">
      <CalendarPlus className="h-3.5 w-3.5" />
      {formatShortDate(member.createdAt)}
    </Badge>
  )
}

function renderRole(member: Member) {
  if (!member.role || member.role === "NONE") {
    return null
  }

  const RoleIcon = member.role === "PRESIDENT" ? Crown : Landmark
  const tone =
    member.role === "PRESIDENT"
      ? "border-amber-500/50 bg-amber-500/10 text-amber-700"
      : "border-emerald-600/40 bg-emerald-600/10 text-emerald-700"

  return (
    <Badge className={`gap-1 ${tone}`}>
      <RoleIcon className="h-3.5 w-3.5" />
      {memberRoleLabels[member.role]}
    </Badge>
  )
}

function compareMembers(left: Member, right: Member, sortKey: MemberSortKey, sortDirection: SortDirection) {
  const direction = sortDirection === "asc" ? 1 : -1
  const leftValue = getMemberSortValue(left, sortKey)
  const rightValue = getMemberSortValue(right, sortKey)

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    return (leftValue - rightValue || left.name.localeCompare(right.name, "ko-KR")) * direction
  }

  return (String(leftValue).localeCompare(String(rightValue), "ko-KR") || left.name.localeCompare(right.name, "ko-KR")) * direction
}

function formatBirthYear(value: number | null) {
  return value ? `${value}년생` : "-"
}

function formatDateValue(value: string | null | undefined) {
  if (!value) {
    return "미정"
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value))
}

function formatShortDate(value: string | null | undefined) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(new Date(value))
}

function getMemberSortValue(member: Member, sortKey: MemberSortKey) {
  if (sortKey === "birthYear") {
    return member.birthYear ?? Number.MAX_SAFE_INTEGER
  }

  if (sortKey === "height") {
    return member.height ?? Number.MAX_SAFE_INTEGER
  }

  if (sortKey === "status") {
    return memberStatusLabels[member.status]
  }

  if (sortKey === "role") {
    const roleRank: Record<MemberRole, number> = {
      PRESIDENT: 0,
      TREASURER: 1,
      NONE: 2,
    }

    return roleRank[member.role ?? "NONE"]
  }

  return member[sortKey] || ""
}
