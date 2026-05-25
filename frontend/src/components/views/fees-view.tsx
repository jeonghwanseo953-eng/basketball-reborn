import { useEffect, useState, type FormEvent } from "react"
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"

import {
  EmptyState,
  FeeMonthSelect,
  FormModal,
  MiniStat,
  NumberInput,
  SelectInput,
  SkeletonRows,
  TextArea,
  TextInput,
  money,
} from "@/components/common"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { paymentStatusLabels } from "@/lib/labels"
import type {
  FeeExpense,
  FeeExpenseRequest,
  FeeMonth,
  FeeMonthRequest,
  FeePayment,
  FeePaymentRequest,
  FeeSummary,
  Member,
  PaymentStatus,
} from "@/types/api"

type FeeModal = "month" | "payment" | "expense" | null

export function FeesView({
  feeMonths,
  payments,
  expenses,
  members,
  summary,
  selectedFeeMonthId,
  monthForm,
  paymentForm,
  expenseForm,
  editingFeeMonthId,
  editingPaymentId,
  editingExpenseId,
  loading,
  saving,
  onSelectFeeMonth,
  onMonthChange,
  onPaymentChange,
  onExpenseChange,
  onSubmitMonth,
  onSubmitPayment,
  onSubmitExpense,
  onEditMonth,
  onCancelMonthEdit,
  onDeleteMonth,
  onEditPayment,
  onCancelPaymentEdit,
  onEditExpense,
  onCancelExpenseEdit,
  onDeletePayment,
  onDeleteExpense,
}: {
  feeMonths: FeeMonth[]
  payments: FeePayment[]
  expenses: FeeExpense[]
  members: Member[]
  summary: FeeSummary | null
  selectedFeeMonthId: number
  monthForm: FeeMonthRequest
  paymentForm: FeePaymentRequest
  expenseForm: FeeExpenseRequest
  editingFeeMonthId: number | null
  editingPaymentId: number | null
  editingExpenseId: number | null
  loading: boolean
  saving: boolean
  onSelectFeeMonth: (feeMonthId: number) => void
  onMonthChange: (value: FeeMonthRequest) => void
  onPaymentChange: (value: FeePaymentRequest) => void
  onExpenseChange: (value: FeeExpenseRequest) => void
  onSubmitMonth: (event: FormEvent<HTMLFormElement>) => void
  onSubmitPayment: (event: FormEvent<HTMLFormElement>) => void
  onSubmitExpense: (event: FormEvent<HTMLFormElement>) => void
  onEditMonth: (feeMonth: FeeMonth) => void
  onCancelMonthEdit: () => void
  onDeleteMonth: (id: number) => void
  onEditPayment: (payment: FeePayment) => void
  onCancelPaymentEdit: () => void
  onEditExpense: (expense: FeeExpense) => void
  onCancelExpenseEdit: () => void
  onDeletePayment: (id: number) => void
  onDeleteExpense: (id: number) => void
}) {
  const [modal, setModal] = useState<FeeModal>(null)
  const [wasSaving, setWasSaving] = useState(false)
  const selectedFeeMonth = feeMonths.find((feeMonth) => feeMonth.id === selectedFeeMonthId) ?? null
  const selectedFeeMonthIndex = feeMonths.findIndex((feeMonth) => feeMonth.id === selectedFeeMonthId)
  const previousFeeMonth = selectedFeeMonthIndex > 0 ? feeMonths[selectedFeeMonthIndex - 1] : null
  const nextFeeMonth =
    selectedFeeMonthIndex >= 0 && selectedFeeMonthIndex < feeMonths.length - 1
      ? feeMonths[selectedFeeMonthIndex + 1]
      : null

  useEffect(() => {
    if (editingFeeMonthId) setModal("month")
    if (editingPaymentId) setModal("payment")
    if (editingExpenseId) setModal("expense")
  }, [editingExpenseId, editingFeeMonthId, editingPaymentId])

  useEffect(() => {
    if (wasSaving && !saving && !editingFeeMonthId && !editingPaymentId && !editingExpenseId) {
      setModal(null)
    }
    setWasSaving(saving)
  }, [editingExpenseId, editingFeeMonthId, editingPaymentId, saving, wasSaving])

  function closeModal() {
    if (modal === "month") onCancelMonthEdit()
    if (modal === "payment") onCancelPaymentEdit()
    if (modal === "expense") onCancelExpenseEdit()
    setModal(null)
  }

  function editMonth(feeMonth: FeeMonth) {
    onEditMonth(feeMonth)
    setModal("month")
  }

  function editPayment(payment: FeePayment) {
    onEditPayment(payment)
    setModal("payment")
  }

  function editExpense(expense: FeeExpense) {
    onEditExpense(expense)
    setModal("expense")
  }

  return (
    <section className="space-y-4">
      {modal === "month" ? (
        <FormModal title={editingFeeMonthId ? "회비 월 수정" : "회비 월 등록"} onClose={closeModal}>
          <form className="space-y-3" onSubmit={onSubmitMonth}>
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="연도" value={monthForm.year} onChange={(year) => onMonthChange({ ...monthForm, year: year ?? new Date().getFullYear() })} />
              <NumberInput label="월" value={monthForm.month} onChange={(month) => onMonthChange({ ...monthForm, month: month ?? 1 })} />
            </div>
            <NumberInput label="회차 수" value={monthForm.roundCount} onChange={(roundCount) => onMonthChange({ ...monthForm, roundCount: roundCount ?? 0 })} />
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="정회원 회비" value={monthForm.regularFeeAmount} onChange={(regularFeeAmount) => onMonthChange({ ...monthForm, regularFeeAmount: regularFeeAmount ?? 0 })} />
              <NumberInput label="게스트비" value={monthForm.guestFeeAmount} onChange={(guestFeeAmount) => onMonthChange({ ...monthForm, guestFeeAmount: guestFeeAmount ?? 0 })} />
            </div>
            <TextArea label="메모" value={monthForm.memo} onChange={(memo) => onMonthChange({ ...monthForm, memo })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={closeModal}>취소</Button>
              <Button disabled={saving}>{editingFeeMonthId ? "회비 월 저장" : "회비 월 등록"}</Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      {modal === "payment" ? (
        <FormModal title={editingPaymentId ? "납부 수정" : "납부 등록"} onClose={closeModal}>
          <form className="space-y-3" onSubmit={onSubmitPayment}>
            <FeeMonthSelect feeMonths={feeMonths} selectedFeeMonthId={selectedFeeMonthId} onSelect={onSelectFeeMonth} />
            <label className="block">
              <span className="mb-1 block text-xs font-semibold text-muted-foreground">회원</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                value={paymentForm.memberId ?? ""}
                onChange={(event) =>
                  onPaymentChange({
                    ...paymentForm,
                    memberId: event.target.value ? Number(event.target.value) : null,
                    payerName: event.target.value ? "" : paymentForm.payerName,
                  })
                }
              >
                <option value="">게스트 / 직접 입력</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>{member.name}</option>
                ))}
              </select>
            </label>
            <TextInput label="납부자 이름" value={paymentForm.payerName} onChange={(payerName) => onPaymentChange({ ...paymentForm, payerName, memberId: null })} />
            <div className="grid grid-cols-2 gap-3">
              <NumberInput label="금액" value={paymentForm.amount} onChange={(amount) => onPaymentChange({ ...paymentForm, amount: amount ?? 0 })} />
              <SelectInput label="상태" value={paymentForm.status} options={paymentStatusLabels} onChange={(status) => onPaymentChange({ ...paymentForm, status: status as PaymentStatus })} />
            </div>
            <TextInput label="납부일" type="date" value={paymentForm.paidDate ?? ""} onChange={(paidDate) => onPaymentChange({ ...paymentForm, paidDate })} />
            <TextArea label="메모" value={paymentForm.memo} onChange={(memo) => onPaymentChange({ ...paymentForm, memo })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={closeModal}>취소</Button>
              <Button disabled={saving || !selectedFeeMonthId || (!paymentForm.memberId && !paymentForm.payerName.trim())}>
                {editingPaymentId ? "납부 저장" : "납부 등록"}
              </Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      {modal === "expense" ? (
        <FormModal title={editingExpenseId ? "지출 수정" : "지출 등록"} onClose={closeModal}>
          <form className="space-y-3" onSubmit={onSubmitExpense}>
            <FeeMonthSelect feeMonths={feeMonths} selectedFeeMonthId={selectedFeeMonthId} onSelect={onSelectFeeMonth} />
            <TextInput label="지출명" value={expenseForm.title} onChange={(title) => onExpenseChange({ ...expenseForm, title })} required />
            <NumberInput label="금액" value={expenseForm.amount} onChange={(amount) => onExpenseChange({ ...expenseForm, amount: amount ?? 0 })} />
            <TextInput label="지출일" type="date" value={expenseForm.expenseDate} onChange={(expenseDate) => onExpenseChange({ ...expenseForm, expenseDate })} required />
            <TextArea label="메모" value={expenseForm.memo} onChange={(memo) => onExpenseChange({ ...expenseForm, memo })} />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={closeModal}>취소</Button>
              <Button disabled={saving || !selectedFeeMonthId || !expenseForm.title.trim()}>{editingExpenseId ? "지출 저장" : "지출 등록"}</Button>
            </div>
          </form>
        </FormModal>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>회비 현황</CardTitle>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button type="button" size="sm" onClick={() => setModal("month")}>
                <Plus className="h-4 w-4" />
                회비 월 등록
              </Button>
              <Button type="button" size="sm" onClick={() => setModal("payment")} disabled={!selectedFeeMonthId}>
                <Plus className="h-4 w-4" />
                납부 등록
              </Button>
              <Button type="button" size="sm" onClick={() => setModal("expense")} disabled={!selectedFeeMonthId}>
                <Plus className="h-4 w-4" />
                지출 등록
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-1">
              <Button type="button" variant="outline" size="sm" disabled={!previousFeeMonth} onClick={() => previousFeeMonth && onSelectFeeMonth(previousFeeMonth.id)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={!nextFeeMonth} onClick={() => nextFeeMonth && onSelectFeeMonth(nextFeeMonth.id)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <FeeMonthSelect feeMonths={feeMonths} selectedFeeMonthId={selectedFeeMonthId} onSelect={onSelectFeeMonth} />
            <Button type="button" variant="outline" size="sm" disabled={!selectedFeeMonth} onClick={() => selectedFeeMonth && editMonth(selectedFeeMonth)}>
              <Pencil className="h-4 w-4" />
              월 수정
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={!selectedFeeMonth} onClick={() => selectedFeeMonth && onDeleteMonth(selectedFeeMonth.id)}>
              <Trash2 className="h-4 w-4" />
              월 삭제
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
            <MiniStat label="수입" value={money(summary?.totalIncome ?? 0)} />
            <MiniStat label="지출" value={money(summary?.totalExpense ?? 0)} />
            <MiniStat label="잔액" value={money(summary?.balance ?? 0)} />
            <MiniStat label="납부" value={`${summary?.paidCount ?? 0}/${(summary?.paidCount ?? 0) + (summary?.unpaidCount ?? 0)}`} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-black">납부 내역</h3>
            {loading ? (
              <SkeletonRows />
            ) : payments.length ? (
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 p-3">
                    <div>
                      <p className="font-bold">{payment.payerName}</p>
                      <p className="text-sm text-muted-foreground">{money(payment.amount)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{paymentStatusLabels[payment.status]}</Badge>
                      <Button type="button" variant="outline" size="sm" onClick={() => editPayment(payment)}>
                        <Pencil className="h-4 w-4" />
                        수정
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => onDeletePayment(payment.id)}>
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="등록된 납부 내역이 없습니다." />
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-black">지출 내역</h3>
            {loading ? (
              <SkeletonRows />
            ) : expenses.length ? (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between gap-3 rounded-md border border-border bg-secondary/40 p-3">
                    <div>
                      <p className="font-bold">{expense.title}</p>
                      <p className="text-sm text-muted-foreground">{expense.expenseDate}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-black text-primary">{money(expense.amount)}</p>
                      <Button type="button" variant="outline" size="sm" onClick={() => editExpense(expense)}>
                        <Pencil className="h-4 w-4" />
                        수정
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => onDeleteExpense(expense.id)}>
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="등록된 지출 내역이 없습니다." />
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
