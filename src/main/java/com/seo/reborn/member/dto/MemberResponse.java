package com.seo.reborn.member.dto;

import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.domain.MemberRole;
import com.seo.reborn.member.domain.MemberStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record MemberResponse(
	Long id,
	String name,
	Integer birthYear,
	Integer height,
	String position,
	String region,
	MemberRole role,
	MemberStatus status,
	LocalDate restUntilDate,
	String memo,
	String profileImageUrl,
	boolean kakaoLinked,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {

	public static MemberResponse from(Member member) {
		return new MemberResponse(
			member.getId(),
			member.getName(),
			member.getBirthYear(),
			member.getHeight(),
			member.getPosition(),
			member.getRegion(),
			member.getRole(),
			member.getStatus(),
			member.getRestUntilDate(),
			member.getMemo(),
			member.getProfileImageUrl(),
			false,
			member.getCreatedAt(),
			member.getUpdatedAt()
		);
	}

	public static MemberResponse from(Member member, boolean kakaoLinked) {
		return new MemberResponse(
			member.getId(),
			member.getName(),
			member.getBirthYear(),
			member.getHeight(),
			member.getPosition(),
			member.getRegion(),
			member.getRole(),
			member.getStatus(),
			member.getRestUntilDate(),
			member.getMemo(),
			member.getProfileImageUrl(),
			kakaoLinked,
			member.getCreatedAt(),
			member.getUpdatedAt()
		);
	}
}
