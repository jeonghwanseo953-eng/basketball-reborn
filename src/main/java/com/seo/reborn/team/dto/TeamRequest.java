package com.seo.reborn.team.dto;

import com.seo.reborn.team.domain.TeamName;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record TeamRequest(
	@NotNull
	Long gameDayId,

	@NotNull
	TeamName name,

	Long captainMemberId,

	@Size(max = 500)
	String memo,

	@Valid
	List<TeamMemberRequest> members
) {
}
