package com.seo.reborn.member.dto;

import com.seo.reborn.member.domain.MemberRole;
import com.seo.reborn.member.domain.MemberStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record MemberRequest(
	@NotBlank
	@Size(max = 50)
	String name,

	@Min(1900)
	@Max(2100)
	Integer birthYear,

	@Min(100)
	@Max(250)
	Integer height,

	@Size(max = 30)
	String position,

	@Size(max = 50)
	String region,

	MemberRole role,

	MemberStatus status,

	LocalDate restUntilDate,

	@Size(max = 500)
	String memo
) {
}
