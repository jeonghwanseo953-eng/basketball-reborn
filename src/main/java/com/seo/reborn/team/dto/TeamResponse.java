package com.seo.reborn.team.dto;

import com.seo.reborn.team.domain.Team;
import com.seo.reborn.team.domain.TeamName;
import java.util.List;

public record TeamResponse(
	Long id,
	Long gameDayId,
	TeamName name,
	Long captainMemberId,
	String captainName,
	String memo,
	List<TeamMemberResponse> members
) {

	public static TeamResponse from(Team team) {
		return new TeamResponse(
			team.getId(),
			team.getGameDay().getId(),
			team.getName(),
			team.getCaptain() == null ? null : team.getCaptain().getId(),
			team.getCaptain() == null ? null : team.getCaptain().getName(),
			team.getMemo(),
			team.getMembers().stream()
				.map(TeamMemberResponse::from)
				.toList()
		);
	}
}
