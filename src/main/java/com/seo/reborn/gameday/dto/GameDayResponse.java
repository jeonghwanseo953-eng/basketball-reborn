package com.seo.reborn.gameday.dto;

import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.gameday.domain.GameDayMode;
import com.seo.reborn.gameday.domain.GameDayStatus;
import com.seo.reborn.gameday.domain.GameDayType;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record GameDayResponse(
	Long id,
	LocalDate gameDate,
	String place,
	LocalTime startTime,
	LocalTime endTime,
	GameDayMode mode,
	GameDayType gameType,
	GameDayStatus status,
	long teamCount,
	String memo,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {

	public static GameDayResponse from(GameDay gameDay) {
		return from(gameDay, 0);
	}

	public static GameDayResponse from(GameDay gameDay, long teamCount) {
		return new GameDayResponse(
			gameDay.getId(),
			gameDay.getGameDate(),
			gameDay.getPlace(),
			gameDay.getStartTime(),
			gameDay.getEndTime(),
			gameDay.getMode(),
			gameDay.getGameType(),
			gameDay.getStatus(),
			teamCount,
			gameDay.getMemo(),
			gameDay.getCreatedAt(),
			gameDay.getUpdatedAt()
		);
	}
}
