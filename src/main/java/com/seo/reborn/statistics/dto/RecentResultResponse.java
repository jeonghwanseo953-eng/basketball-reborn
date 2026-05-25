package com.seo.reborn.statistics.dto;

import com.seo.reborn.result.domain.ResultOutcome;
import com.seo.reborn.team.domain.TeamName;
import java.time.LocalDate;

public record RecentResultResponse(
	Long gameResultId,
	Long gameDayId,
	LocalDate gameDate,
	int matchNo,
	int quarterNo,
	TeamName teamName,
	TeamName opponentTeamName,
	int pointsFor,
	int pointsAgainst,
	ResultOutcome outcome
) {
}
