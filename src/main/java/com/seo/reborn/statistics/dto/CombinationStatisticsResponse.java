package com.seo.reborn.statistics.dto;

import java.util.List;

public record CombinationStatisticsResponse(
	List<Long> memberIds,
	List<String> memberNames,
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
