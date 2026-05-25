package com.seo.reborn.statistics.dto;

import java.util.List;

public record MemberStatisticsResponse(
	Long memberId,
	String memberName,
	long playedCount,
	long winCount,
	long lossCount,
	long drawCount,
	double winRate,
	double averagePointsFor,
	double averagePointsAgainst,
	List<RecentResultResponse> recentResults
) {
}
