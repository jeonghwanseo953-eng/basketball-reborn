package com.seo.reborn.attendance.dto;

import com.seo.reborn.attendance.domain.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AttendanceVoteRequest(
	@NotNull
	Long gameDayId,

	Long memberId,

	@Size(max = 50)
	String voterName,

	AttendanceStatus status,

	@Size(max = 500)
	String memo
) {
}
