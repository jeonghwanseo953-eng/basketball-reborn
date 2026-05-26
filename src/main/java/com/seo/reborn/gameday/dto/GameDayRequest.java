package com.seo.reborn.gameday.dto;

import com.seo.reborn.gameday.domain.GameDayMode;
import com.seo.reborn.gameday.domain.GameDayStatus;
import com.seo.reborn.gameday.domain.GameDayType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record GameDayRequest(
	@NotNull
	LocalDate gameDate,

	@NotBlank
	@Size(max = 100)
	String place,

	@NotNull
	LocalTime startTime,

	@NotNull
	LocalTime endTime,

	GameDayMode mode,

	GameDayType gameType,

	GameDayStatus status,

	@Size(max = 500)
	String memo,

	Long teamBuilderMemberId
) {
}
