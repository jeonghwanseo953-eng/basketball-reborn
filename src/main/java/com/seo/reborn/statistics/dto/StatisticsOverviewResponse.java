package com.seo.reborn.statistics.dto;

public record StatisticsOverviewResponse(
	CombinationStatisticsResponse bestDuo,
	CombinationStatisticsResponse bestScoringDuo,
	CombinationStatisticsResponse bestDefenseDuo,
	CombinationStatisticsResponse mostPlayedDuo
) {
}
