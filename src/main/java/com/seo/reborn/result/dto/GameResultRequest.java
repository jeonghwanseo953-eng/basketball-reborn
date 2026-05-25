package com.seo.reborn.result.dto;

import com.seo.reborn.team.domain.TeamName;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record GameResultRequest(
	@NotNull
	Long gameDayId,

	@Min(1)
	@Max(12)
	int matchNo,

	@Min(1)
	@Max(12)
	int quarterNo,

	@NotNull
	TeamName team1Name,

	@NotNull
	TeamName team2Name,

	@Min(0)
	int team1Score,

	@Min(0)
	int team2Score,

	@Size(max = 500)
	String memo
) {
}
