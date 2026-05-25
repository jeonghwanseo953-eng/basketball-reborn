package com.seo.reborn.statistics.dto;

public record MemberSynergyResponse(
	Long memberId,
	String memberName,
	long playedCount,
	long winCount,
	long lossCount,
	long drawCount,
	double winRate,
	double averagePointsFor,
	double averagePointsAgainst
) {
}
