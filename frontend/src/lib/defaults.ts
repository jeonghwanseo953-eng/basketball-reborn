import type {
  AttendanceVoteRequest,
  FeeExpenseRequest,
  FeeMonthRequest,
  FeePaymentRequest,
  GameDayRequest,
  GameResultRequest,
  MemberRequest,
  NoticeRequest,
  TeamRequest,
} from "@/types/api"

const now = new Date()

export const emptyMemberForm: MemberRequest = {
  name: "",
  birthYear: null,
  height: null,
  position: "",
  region: "",
  role: "NONE",
  status: "REGULAR",
  restUntilDate: null,
  memo: "",
}

export const emptyGameForm: GameDayRequest = {
  gameDate: new Date().toISOString().slice(0, 10),
  place: "송파청소년센터",
  startTime: "19:00",
  endTime: "21:00",
  mode: "THREE_WAY",
  gameType: "REGULAR",
  status: "SCHEDULED",
  memo: "",
  teamBuilderMemberId: null,
}

export const emptyAttendanceForm: AttendanceVoteRequest = {
  gameDayId: 0,
  memberId: null,
  voterName: "",
  status: "ATTENDING",
  memo: "",
}

export const emptyTeamForm: TeamRequest = {
  gameDayId: 0,
  name: "BLACK",
  captainMemberId: null,
  memo: "",
  members: [{ memberId: null, playerName: "" }],
}

export const emptyResultForm: GameResultRequest = {
  gameDayId: 0,
  matchNo: 1,
  quarterNo: 1,
  team1Name: "BLACK",
  team2Name: "RED",
  team1Score: 0,
  team2Score: 0,
  memo: "",
}

export const emptyNoticeForm: NoticeRequest = {
  title: "",
  content: "",
  authorName: "",
  pinned: false,
}

export const emptyFeeMonthForm: FeeMonthRequest = {
  year: now.getFullYear(),
  month: now.getMonth() + 1,
  roundCount: 4,
  regularFeeAmount: 40000,
  guestFeeAmount: 10000,
  memo: "",
}

export const emptyFeePaymentForm: FeePaymentRequest = {
  feeMonthId: 0,
  memberId: null,
  payerName: "",
  amount: 40000,
  status: "PAID",
  paidDate: new Date().toISOString().slice(0, 10),
  memo: "",
}

export const emptyFeeExpenseForm: FeeExpenseRequest = {
  feeMonthId: 0,
  title: "",
  amount: 0,
  expenseDate: new Date().toISOString().slice(0, 10),
  memo: "",
}
