package com.seo.reborn.member.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MemberProfileImageRequest(
	@NotBlank
	@Size(max = 1_000_000)
	String profileImageUrl
) {
}
