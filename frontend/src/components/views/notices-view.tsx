import { useEffect, useMemo, useState, type FormEvent } from "react"
import { ArrowLeft, CalendarDays, MessageSquareText, Pencil, Pin, Plus, Trash2, UserRound } from "lucide-react"

import { EmptyState, FormModal, SelectInput, SkeletonRows, TextArea, TextInput } from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createNoticeComment, deleteNoticeComment, getNoticeComments, updateNoticeComment } from "@/lib/api"
import type { Notice, NoticeComment, NoticeCommentRequest, NoticeRequest } from "@/types/api"

export function NoticesView({
  notices,
  form,
  editingNoticeId,
  loading,
  saving,
  currentAuthorName,
  initialNoticeId,
  onInitialNoticeOpened,
  onChange,
  onSubmit,
  onEdit,
  onCancelEdit,
  onDelete,
  readOnly = false,
}: {
  notices: Notice[]
  form: NoticeRequest
  editingNoticeId: number | null
  loading: boolean
  saving: boolean
  currentAuthorName: string
  initialNoticeId?: number | null
  onInitialNoticeOpened?: () => void
  onChange: (value: NoticeRequest) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onEdit: (notice: Notice) => void
  onCancelEdit: () => void
  onDelete: (id: number) => void
  readOnly?: boolean
}) {
  const editing = editingNoticeId !== null
  const [formOpen, setFormOpen] = useState(false)
  const [wasSaving, setWasSaving] = useState(false)
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null)
  const [comments, setComments] = useState<NoticeComment[]>([])
  const [commentForm, setCommentForm] = useState<NoticeCommentRequest>({ authorName: "", content: "" })
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editingCommentContent, setEditingCommentContent] = useState("")
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentSaving, setCommentSaving] = useState(false)
  const [query, setQuery] = useState("")
  const [pinFilter, setPinFilter] = useState<"ALL" | "PINNED" | "NORMAL">("ALL")
  const fixedAuthorName = currentAuthorName.trim()
  const noticeAuthorName = editing ? form.authorName || fixedAuthorName : fixedAuthorName
  const displayedNotices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return notices.filter((notice) => {
      const matchesPinned =
        pinFilter === "ALL" || (pinFilter === "PINNED" && notice.pinned) || (pinFilter === "NORMAL" && !notice.pinned)
      const searchableText = [notice.title, notice.content, notice.authorName].join(" ").toLowerCase()
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery)

      return matchesPinned && matchesQuery
    })
  }, [notices, query, pinFilter])
  const pinnedNotices = displayedNotices.filter((notice) => notice.pinned)
  const normalNotices = displayedNotices.filter((notice) => !notice.pinned)

  useEffect(() => {
    if (editing) {
      setFormOpen(true)
    }
  }, [editing])

  useEffect(() => {
    if (wasSaving && !saving && !form.title.trim() && !editing) {
      setFormOpen(false)
    }
    setWasSaving(saving)
  }, [editing, form.title, saving, wasSaving])

  useEffect(() => {
    if (!initialNoticeId || selectedNotice?.id === initialNoticeId) {
      return
    }

    const notice = notices.find((item) => item.id === initialNoticeId)
    if (!notice) {
      return
    }

    void openNotice(notice)
    onInitialNoticeOpened?.()
  }, [initialNoticeId, notices, onInitialNoticeOpened, selectedNotice?.id])

  useEffect(() => {
    if (!selectedNotice) {
      return
    }

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    })
  }, [selectedNotice])

  function openCreateForm() {
    if (readOnly) return
    onCancelEdit()
    onChange({ title: "", content: "", authorName: fixedAuthorName, pinned: false })
    setSelectedNotice(null)
    setFormOpen(true)
  }

  function closeForm() {
    onCancelEdit()
    setFormOpen(false)
  }

  function editNotice(notice: Notice) {
    if (readOnly) return
    setSelectedNotice(null)
    onEdit(notice)
    setFormOpen(true)
  }

  function deleteNotice(notice: Notice) {
    if (readOnly) return
    setSelectedNotice(null)
    onDelete(notice.id)
  }

  async function openNotice(notice: Notice) {
    setSelectedNotice(notice)
    setComments([])
    setCommentForm({ authorName: fixedAuthorName, content: "" })
    cancelEditComment()
    setCommentsLoading(true)

    try {
      setComments(await getNoticeComments(notice.id))
    } catch {
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (readOnly) return

    if (!selectedNotice || !fixedAuthorName || !commentForm.content.trim()) {
      return
    }

    setCommentSaving(true)
    try {
      const created = await createNoticeComment(selectedNotice.id, {
        authorName: fixedAuthorName,
        content: commentForm.content.trim(),
      })
      setComments((current) => [...current, created])
      setCommentForm({ authorName: fixedAuthorName, content: "" })
    } finally {
      setCommentSaving(false)
    }
  }

  function startEditComment(comment: NoticeComment) {
    if (readOnly || !canModifyAuthor(comment.authorName, fixedAuthorName)) return
    setEditingCommentId(comment.id)
    setEditingCommentContent(comment.content)
  }

  function cancelEditComment() {
    setEditingCommentId(null)
    setEditingCommentContent("")
  }

  async function submitEditComment(comment: NoticeComment) {
    if (readOnly || !selectedNotice || !canModifyAuthor(comment.authorName, fixedAuthorName) || !editingCommentContent.trim()) {
      return
    }

    const updated = await updateNoticeComment(selectedNotice.id, comment.id, {
      authorName: fixedAuthorName,
      content: editingCommentContent.trim(),
    })
    setComments((current) => current.map((currentComment) => (currentComment.id === updated.id ? updated : currentComment)))
    cancelEditComment()
  }

  async function removeComment(comment: NoticeComment) {
    if (readOnly) return
    if (!canModifyAuthor(comment.authorName, fixedAuthorName)) return
    if (!selectedNotice || !confirm("댓글을 삭제할까요?")) {
      return
    }

    await deleteNoticeComment(selectedNotice.id, comment.id)
    setComments((current) => current.filter((currentComment) => currentComment.id !== comment.id))
  }

  return (
    <section className="space-y-4">
      {formOpen ? (
        <FormModal
          title={
            <>
              {editing ? <Pencil className="h-5 w-5 text-accent" /> : <MessageSquareText className="h-5 w-5 text-accent" />}
              {editing ? "게시글 수정" : "게시글 등록"}
            </>
          }
          onClose={closeForm}
        >
          <form className="space-y-3" onSubmit={onSubmit}>
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <TextInput label="제목" value={form.title} onChange={(title) => onChange({ ...form, title })} required />
              <FixedAuthorInput value={noticeAuthorName} />
            </div>
            <TextArea label="내용" value={form.content} onChange={(content) => onChange({ ...form, content })} />
            <label className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/30 p-3 text-sm font-semibold">
              <span className="flex items-center gap-2">
                <Pin className="h-4 w-4 text-accent" />
                공지로 고정
              </span>
              <input
                className="h-4 w-4"
                type="checkbox"
                checked={form.pinned}
                onChange={(event) => onChange({ ...form, pinned: event.target.checked })}
              />
            </label>
            <div className="flex justify-end">
              <Button className="w-full sm:w-auto sm:min-w-32" disabled={saving || !form.title.trim() || !noticeAuthorName || !form.content.trim()}>
                {editing ? <Pencil className="h-4 w-4" /> : <MessageSquareText className="h-4 w-4" />}
                {saving ? "저장 중" : editing ? "게시글 수정" : "게시글 등록"}
              </Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      {selectedNotice ? (
        <NoticeDetailView
          notice={selectedNotice}
          comments={comments}
          commentForm={commentForm}
          commentsLoading={commentsLoading}
          commentSaving={commentSaving}
          currentAuthorName={fixedAuthorName}
          editingCommentContent={editingCommentContent}
          editingCommentId={editingCommentId}
          onBack={() => setSelectedNotice(null)}
          onCancelCommentEdit={cancelEditComment}
          onCommentChange={setCommentForm}
          onCommentDelete={(comment) => void removeComment(comment)}
          onCommentEdit={startEditComment}
          onCommentEditChange={setEditingCommentContent}
          onCommentEditSubmit={(comment) => void submitEditComment(comment)}
          onCommentSubmit={(event) => void submitComment(event)}
          onDelete={deleteNotice}
          onEdit={editNotice}
          readOnly={readOnly}
        />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-accent" />
                게시판
              </CardTitle>
              <div className="flex items-center gap-2">
                {readOnly ? (
                  <Badge className="border-amber-500/35 bg-amber-500/10 text-amber-700">조회 전용</Badge>
                ) : (
                  <Button type="button" size="sm" onClick={openCreateForm}>
                    <Plus className="h-4 w-4" />
                    글쓰기
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
              <TextInput label="검색" value={query} onChange={setQuery} />
              <SelectInput
                label="분류"
                value={pinFilter}
                options={{ ALL: "전체", PINNED: "공지", NORMAL: "일반글" }}
                onChange={(value) => setPinFilter(value as "ALL" | "PINNED" | "NORMAL")}
              />
            </div>
            {loading ? (
              <SkeletonRows />
            ) : displayedNotices.length ? (
              <div className="space-y-4">
                {pinnedNotices.length ? (
                  <div className="overflow-hidden rounded-md border border-accent/35 bg-accent/5">
                    {pinnedNotices.map((notice) => (
                      <NoticeListRow key={notice.id} notice={notice} pinned onOpen={(nextNotice) => void openNotice(nextNotice)} />
                    ))}
                  </div>
                ) : null}

                {normalNotices.length ? (
                  <div className="overflow-hidden rounded-md border border-border bg-background">
                    {normalNotices.map((notice) => (
                      <NoticeListRow key={notice.id} notice={notice} onOpen={(nextNotice) => void openNotice(nextNotice)} />
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <EmptyState title="조건에 맞는 게시글이 없습니다." />
            )}
          </CardContent>
        </Card>
      )}
    </section>
  )
}

function NoticeListRow({
  notice,
  pinned = false,
  onOpen,
}: {
  notice: Notice
  pinned?: boolean
  onOpen: (notice: Notice) => void
}) {
  return (
    <article
      className={`grid cursor-pointer gap-2 border-b px-4 py-3.5 transition-colors last:border-b-0 sm:grid-cols-[1fr_120px_130px] sm:items-center ${
        pinned ? "border-accent/20 hover:bg-accent/10" : "border-border hover:bg-secondary/35"
      }`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(notice)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onOpen(notice)
        }
      }}
    >
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {notice.pinned ? <Badge className="shrink-0 border-accent/40 bg-accent/10 text-accent">공지</Badge> : null}
          <h2 className="min-w-0 truncate text-sm font-black text-foreground">{notice.title}</h2>
        </div>
        <p className="mt-1.5 line-clamp-2 text-sm font-medium leading-5 text-muted-foreground sm:line-clamp-1 sm:text-xs">{notice.content}</p>
      </div>
      <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
        <UserRound className="h-3.5 w-3.5" />
        {notice.authorName}
      </p>
      <p className="text-xs font-semibold text-muted-foreground sm:text-right">{formatNoticeDate(notice.createdAt)}</p>
    </article>
  )
}

function FixedAuthorInput({ value }: { value: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">작성자</span>
      <input
        className="h-10 w-full rounded-md border border-input bg-secondary/70 px-3 text-sm font-semibold text-muted-foreground outline-none"
        value={value}
        readOnly
      />
    </label>
  )
}

function NoticeDetailView({
  notice,
  comments,
  commentForm,
  commentsLoading,
  commentSaving,
  currentAuthorName,
  editingCommentContent,
  editingCommentId,
  onBack,
  onCancelCommentEdit,
  onCommentChange,
  onCommentDelete,
  onCommentEdit,
  onCommentEditChange,
  onCommentEditSubmit,
  onCommentSubmit,
  onDelete,
  onEdit,
  readOnly = false,
}: {
  notice: Notice
  comments: NoticeComment[]
  commentForm: NoticeCommentRequest
  commentsLoading: boolean
  commentSaving: boolean
  currentAuthorName: string
  editingCommentContent: string
  editingCommentId: number | null
  onBack: () => void
  onCancelCommentEdit: () => void
  onCommentChange: (form: NoticeCommentRequest) => void
  onCommentDelete: (comment: NoticeComment) => void
  onCommentEdit: (comment: NoticeComment) => void
  onCommentEditChange: (content: string) => void
  onCommentEditSubmit: (comment: NoticeComment) => void
  onCommentSubmit: (event: FormEvent<HTMLFormElement>) => void
  onDelete: (notice: Notice) => void
  onEdit: (notice: Notice) => void
  readOnly?: boolean
}) {
  const ownNotice = canModifyAuthor(notice.authorName, currentAuthorName)

  return (
    <Card>
      <CardHeader className="border-b border-border bg-secondary/15 px-4 py-4">
        <div className="space-y-4">
          <Button className="w-fit" type="button" variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            목록
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {notice.pinned ? <Badge className="border-accent/40 bg-accent/10 text-accent">공지</Badge> : null}
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {formatNoticeDate(notice.createdAt)}
                </span>
              </div>
              <CardTitle className="text-2xl leading-tight">{notice.title}</CardTitle>
              <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                <UserRound className="h-3.5 w-3.5" />
                {notice.authorName}
              </p>
            </div>
            {!readOnly && ownNotice ? (
              <div className="grid grid-cols-2 gap-2 sm:w-48">
                <Button type="button" onClick={() => onEdit(notice)}>
                  <Pencil className="h-4 w-4" />
                  수정
                </Button>
                <Button type="button" variant="outline" onClick={() => onDelete(notice)}>
                  <Trash2 className="h-4 w-4" />
                  삭제
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-4">
        <div className="min-h-40 whitespace-pre-wrap rounded-md border border-border bg-background p-4 text-sm leading-7 text-foreground">
          {notice.content}
        </div>
        <section className="rounded-md border border-border bg-background">
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2">
            <h3 className="text-sm font-black text-foreground">댓글</h3>
            <Badge>{comments.length}</Badge>
          </div>
          <div className="space-y-3 p-3">
              {commentsLoading ? (
                <p className="text-sm font-semibold text-muted-foreground">댓글 확인 중</p>
              ) : comments.length ? (
                <div className="space-y-2">
                  {comments.map((comment) => (
                    <article key={comment.id} className="rounded-md border border-border bg-secondary/20 px-3 py-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-black text-foreground">{comment.authorName}</p>
                          {editingCommentId === comment.id ? (
                            <div className="mt-2 grid gap-2">
                              <input
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                                value={editingCommentContent}
                                onChange={(event) => onCommentEditChange(event.target.value)}
                                autoFocus
                              />
                              <div className="flex gap-2">
                                <Button
                                  className="h-8 px-3 text-xs"
                                  type="button"
                                  size="sm"
                                  disabled={!editingCommentContent.trim()}
                                  onClick={() => onCommentEditSubmit(comment)}
                                >
                                  저장
                                </Button>
                                <Button className="h-8 px-3 text-xs" type="button" variant="outline" size="sm" onClick={onCancelCommentEdit}>
                                  취소
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{comment.content}</p>
                          )}
                          <p className="mt-2 text-xs font-semibold text-muted-foreground">{formatNoticeDate(comment.createdAt)}</p>
                        </div>
                        {!readOnly && canModifyAuthor(comment.authorName, currentAuthorName) && editingCommentId !== comment.id ? (
                          <div className="flex shrink-0 gap-1">
                            <button
                              className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                              type="button"
                              onClick={() => onCommentEdit(comment)}
                            >
                              수정
                            </button>
                            <button
                              className="rounded-md border border-border px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
                              type="button"
                              onClick={() => onCommentDelete(comment)}
                            >
                              삭제
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed border-border px-3 py-4 text-center text-sm font-semibold text-muted-foreground">
                  아직 댓글이 없습니다.
                </p>
              )}

              {!readOnly ? (
                <form className="grid gap-2 border-t border-border pt-3" onSubmit={onCommentSubmit}>
                  <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
                    <input
                      className="h-10 rounded-md border border-input bg-secondary/70 px-3 text-sm font-semibold text-muted-foreground outline-none"
                      value={currentAuthorName}
                      readOnly
                      aria-label="작성자"
                    />
                    <input
                      className="h-10 rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                      placeholder="댓글을 입력하세요"
                      value={commentForm.content}
                      onChange={(event) => onCommentChange({ ...commentForm, content: event.target.value })}
                    />
                  </div>
                  <Button disabled={commentSaving || !currentAuthorName || !commentForm.content.trim()}>
                    {commentSaving ? "등록 중" : "댓글 등록"}
                  </Button>
                </form>
              ) : null}
            </div>
          </section>
      </CardContent>
    </Card>
  )
}

function formatNoticeDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value))
}

function canModifyAuthor(authorName: string, currentAuthorName: string) {
  return Boolean(currentAuthorName.trim()) && authorName.trim() === currentAuthorName.trim()
}
