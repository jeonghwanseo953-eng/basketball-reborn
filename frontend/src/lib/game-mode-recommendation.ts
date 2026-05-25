export type GameModeRecommendation = {
  label: string
  description: string
  tone: "blue" | "sky" | "slate"
}

export function getGameModeRecommendation(attendingCount: number): GameModeRecommendation {
  if (attendingCount >= 15) {
    return {
      label: "3파전 권장",
      description: "참석 인원이 충분합니다.",
      tone: "blue",
    }
  }

  if (attendingCount >= 10) {
    return {
      label: "2파전 권장",
      description: "2팀 운영이 적당합니다.",
      tone: "sky",
    }
  }

  return {
    label: "인원 부족",
    description: "10명 이상이면 경기 운영이 안정적입니다.",
    tone: "slate",
  }
}
