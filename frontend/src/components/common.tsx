import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import type { FeeMonth, GameResult, TeamName } from "@/types/api"
import { teamLabels } from "@/lib/labels"

export function FeeMonthSelect({
  feeMonths,
  selectedFeeMonthId,
  onSelect,
}: {
  feeMonths: FeeMonth[]
  selectedFeeMonthId: number
  onSelect: (feeMonthId: number) => void
}) {
  return (
    <select
      className="h-10 rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      value={selectedFeeMonthId || ""}
      onChange={(event) => onSelect(Number(event.target.value))}
    >
      <option value="" disabled>
        월 선택
      </option>
      {feeMonths.map((feeMonth) => (
        <option key={feeMonth.id} value={feeMonth.id}>
          {feeMonth.year}-{String(feeMonth.month).padStart(2, "0")}
        </option>
      ))}
    </select>
  )
}

export function TabButton({
  active,
  disabled = false,
  icon: Icon,
  onClick,
  title,
  children,
}: {
  active: boolean
  disabled?: boolean
  icon?: LucideIcon
  onClick: () => void
  title?: string
  children: ReactNode
}) {
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors ${
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-slate-900/10"
          : disabled
            ? "cursor-not-allowed text-muted-foreground/50"
          : "text-muted-foreground hover:bg-card hover:text-foreground"
      }`}
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
    >
      {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
      {children}
    </button>
  )
}

export function TextInput({
  label,
  value,
  required,
  type = "text",
  onChange,
}: {
  label: string
  value: string
  required?: boolean
  type?: string
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <input
        className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        type="number"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
      />
    </label>
  )
}

export function SelectInput({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Record<string, string>
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <select
        className="h-10 w-full rounded-md border border-input bg-secondary px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {Object.entries(options).map(([optionValue, labelText]) => (
          <option key={optionValue} value={optionValue}>
            {labelText}
          </option>
        ))}
      </select>
    </label>
  )
}

export function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      <textarea
        className="min-h-24 w-full resize-none rounded-md border border-input bg-secondary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

export function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-background/50 p-3">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  )
}

export function renderResult(result: GameResult) {
  return (
    <article key={result.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-md border border-border bg-secondary/40 p-4">
      <TeamScore team={result.team1Name} score={result.team1Score} align="left" />
      <div className="text-center text-xs font-black text-muted-foreground">
        M{result.matchNo}
        <br />
        Q{result.quarterNo}
      </div>
      <TeamScore team={result.team2Name} score={result.team2Score} align="right" />
    </article>
  )
}

function TeamScore({ team, score, align }: { team: TeamName; score: number; align: "left" | "right" }) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <p className="text-xs font-semibold text-muted-foreground">{teamLabels[team]}</p>
      <p className="text-3xl font-black text-foreground">{score}</p>
    </div>
  )
}

export function StatBox({ label, value, tone }: { label: string; value: number; tone: "blue" | "slate" | "sky" }) {
  const toneClass = {
    blue: "text-accent",
    slate: "text-slate-600",
    sky: "text-sky-700",
  }[tone]

  return (
    <div className="rounded-md border border-border bg-secondary/60 p-3 text-center">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-black ${toneClass}`}>{value}</p>
    </div>
  )
}

export function SkeletonRows() {
  return (
    <div className="space-y-3">
      <div className="h-12 animate-pulse rounded-md bg-secondary" />
      <div className="h-12 animate-pulse rounded-md bg-secondary" />
      <div className="h-12 animate-pulse rounded-md bg-secondary" />
    </div>
  )
}

export function EmptyState({ title }: { title: string }) {
  return <p className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">{title}</p>
}

export function FormModal({
  title,
  children,
  onClose,
  size = "default",
}: {
  title: ReactNode
  children: ReactNode
  onClose: () => void
  size?: "default" | "wide"
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 px-3 py-4 backdrop-blur-sm sm:items-center">
      <section
        className={`max-h-[calc(100vh-32px)] w-full overflow-y-auto rounded-lg border border-border bg-card shadow-2xl ${
          size === "wide" ? "max-w-7xl" : "max-w-2xl"
        }`}
      >
        <header className={`flex items-center justify-between gap-3 border-b border-border ${size === "wide" ? "p-4" : "p-5"}`}>
          <h2 className="flex items-center gap-2 text-lg font-black">{title}</h2>
          <button
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground"
            type="button"
            onClick={onClose}
          >
            닫기
          </button>
        </header>
        <div className={size === "wide" ? "p-4" : "p-5"}>{children}</div>
      </section>
    </div>
  )
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value))
}

export function money(value: number) {
  return new Intl.NumberFormat("ko-KR").format(value)
}
