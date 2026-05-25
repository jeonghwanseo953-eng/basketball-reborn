package com.seo.reborn.result.dto;

import com.seo.reborn.result.domain.GameResult;
import com.seo.reborn.result.domain.ResultOutcome;
import com.seo.reborn.team.domain.TeamName;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record GameResultResponse(
	Long id,
	Long gameDayId,
	LocalDate gameDate,
	int matchNo,
	int quarterNo,
	TeamName team1Name,
	TeamName team2Name,
	int team1Score,
	int team2Score,
	ResultOutcome outcome,
	String memo,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {

	public static GameResultResponse from(GameResult result) {
		return new GameResultResponse(
			result.getId(),
			result.getGameDay().getId(),
			result.getGameDay().getGameDate(),
			result.getMatchNo(),
			result.getQuarterNo(),
			result.getTeam1Name(),
			result.getTeam2Name(),
			result.getTeam1Score(),
			result.getTeam2Score(),
			result.getOutcome(),
			result.getMemo(),
			result.getCreatedAt(),
			result.getUpdatedAt()
		);
	}
}
