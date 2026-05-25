package com.seo.reborn.team.dto;

import com.seo.reborn.team.domain.TeamMember;

public record TeamMemberResponse(
	Long id,
	Long memberId,
	String playerName,
	int sortOrder
) {

	public static TeamMemberResponse from(TeamMember member) {
		return new TeamMemberResponse(
			member.getId(),
			member.getMember() == null ? null : member.getMember().getId(),
			member.getMember() == null ? member.getPlayerName() : member.getMember().getName(),
			member.getSortOrder()
		);
	}
}
