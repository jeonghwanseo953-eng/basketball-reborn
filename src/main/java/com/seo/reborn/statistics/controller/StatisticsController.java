package com.seo.reborn.statistics.controller;

import com.seo.reborn.statistics.dto.CombinationStatisticsResponse;
import com.seo.reborn.statistics.dto.MemberStatisticsResponse;
import com.seo.reborn.statistics.dto.MemberSynergyResponse;
import com.seo.reborn.statistics.dto.StatisticsOverviewResponse;
import com.seo.reborn.statistics.service.StatisticsService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

	private final StatisticsService statisticsService;

	public StatisticsController(StatisticsService statisticsService) {
		this.statisticsService = statisticsService;
	}

	@GetMapping("/members")
	public List<MemberStatisticsResponse> findMemberStatistics(
		@RequestParam(defaultValue = "RECENT") String scope,
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month) {
		return statisticsService.findMemberStatistics(scope, year, month);
	}

	@GetMapping("/overview")
	public StatisticsOverviewResponse findOverview(
		@RequestParam(defaultValue = "RECENT") String scope,
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month) {
		return statisticsService.findOverview(scope, year, month);
	}

	@GetMapping("/members/{memberId}")
	public MemberStatisticsResponse findMemberStatistics(
		@PathVariable Long memberId,
		@RequestParam(defaultValue = "RECENT") String scope,
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month) {
		return statisticsService.findMemberStatistics(memberId, scope, year, month);
	}

	@GetMapping("/members/{memberId}/synergies")
	public List<MemberSynergyResponse> findMemberSynergies(
		@PathVariable Long memberId,
		@RequestParam(defaultValue = "RECENT") String scope,
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month) {
		return statisticsService.findMemberSynergies(memberId, scope, year, month);
	}

	@GetMapping("/combinations")
	public CombinationStatisticsResponse findCombinationStatistics(
		@RequestParam List<Long> memberIds,
		@RequestParam(defaultValue = "RECENT") String scope,
		@RequestParam(required = false) Integer year,
		@RequestParam(required = false) Integer month) {
		return statisticsService.findCombinationStatistics(memberIds, scope, year, month);
	}

}
