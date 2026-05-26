import type { AttendanceStatus, GameDayMode, GameDayStatus, GameDayType, MemberRole, MemberStatus, PaymentStatus, TeamName } from "@/types/api"

export const teamLabels: Record<TeamName, string> = {
  BLACK: "블랙",
  WHITE: "화이트",
  RED: "레드",
}

export const modeLabels: Record<GameDayMode, string> = {
  TWO_WAY: "2파전",
  THREE_WAY: "3파전",
}

export const gameTypeLabels: Record<GameDayType, string> = {
  REGULAR: "정규",
  EXCHANGE: "교류전",
}

export const gameStatusLabels: Record<GameDayStatus, string> = {
  SCHEDULED: "예정",
  COMPLETED: "완료",
  HOLIDAY: "휴무",
  CLOSED: "마감",
}

export const memberStatusLabels: Record<MemberStatus, string> = {
  REGULAR: "정회원",
  GUEST: "게스트",
  RESTING: "휴식",
  WITHDRAWN: "탈퇴",
}

export const memberRoleLabels: Record<MemberRole, string> = {
  NONE: "없음",
  PRESIDENT: "회장",
  TREASURER: "총무",
  WEB_ADMIN: "웹관리자",
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PAID: "납부",
  UNPAID: "미납",
}

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  ATTENDING: "참석",
  ABSENT: "불참",
  UNDECIDED: "미정",
}
