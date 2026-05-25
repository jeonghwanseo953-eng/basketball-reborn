package com.seo.reborn.attendance.dto;

import com.seo.reborn.attendance.domain.AttendanceStatus;
import com.seo.reborn.attendance.domain.AttendanceVote;
import java.time.LocalDateTime;

public record AttendanceVoteResponse(
	Long id,
	Long gameDayId,
	Long memberId,
	String voterName,
	AttendanceStatus status,
	String memo,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {

	public static AttendanceVoteResponse from(AttendanceVote vote) {
		return new AttendanceVoteResponse(
			vote.getId(),
			vote.getGameDay().getId(),
			vote.getMember() == null ? null : vote.getMember().getId(),
			vote.getMember() == null ? vote.getVoterName() : vote.getMember().getName(),
			vote.getStatus(),
			vote.getMemo(),
			vote.getCreatedAt(),
			vote.getUpdatedAt()
		);
	}
}
