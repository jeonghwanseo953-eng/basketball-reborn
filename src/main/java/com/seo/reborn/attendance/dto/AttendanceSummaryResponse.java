package com.seo.reborn.attendance.dto;

public record AttendanceSummaryResponse(
	Long gameDayId,
	long attendingCount,
	long absentCount,
	long undecidedCount,
	long totalCount
) {
}
