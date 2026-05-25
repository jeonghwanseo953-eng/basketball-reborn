package com.seo.reborn.team.dto;

import jakarta.validation.constraints.Size;

public record TeamMemberRequest(
	Long memberId,

	@Size(max = 50)
	String playerName
) {
}
