package com.seo.reborn.statistics.service;

import com.seo.reborn.gameday.domain.GameDayType;
import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.domain.MemberStatus;
import com.seo.reborn.member.repository.MemberRepository;
import com.seo.reborn.result.domain.GameResult;
import com.seo.reborn.result.domain.ResultOutcome;
import com.seo.reborn.result.repository.GameResultRepository;
import com.seo.reborn.statistics.dto.CombinationStatisticsResponse;
import com.seo.reborn.statistics.dto.MemberStatisticsResponse;
import com.seo.reborn.statistics.dto.MemberSynergyResponse;
import com.seo.reborn.statistics.dto.RecentResultResponse;
import com.seo.reborn.statistics.dto.StatisticsOverviewResponse;
import com.seo.reborn.team.domain.Team;
import com.seo.reborn.team.domain.TeamMember;
import com.seo.reborn.team.domain.TeamName;
import com.seo.reborn.team.repository.TeamRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class StatisticsService {

	private final MemberRepository memberRepository;
	private final TeamRepository teamRepository;
	private final GameResultRepository gameResultRepository;

	public StatisticsService(MemberRepository memberRepository, TeamRepository teamRepository,
		GameResultRepository gameResultRepository) {
		this.memberRepository = memberRepository;
		this.teamRepository = teamRepository;
		this.gameResultRepository = gameResultRepository;
	}

	public List<MemberStatisticsResponse> findMemberStatistics(String scope, Integer year, Integer month) {
		StatisticsFilter filter = createFilter(scope, year, month);

		return memberRepository.findAll().stream()
			.map(member -> calculateMemberStatistics(member, true, filter))
			.sorted(Comparator.comparing(MemberStatisticsResponse::winRate).reversed()
				.thenComparing(Comparator.comparing(MemberStatisticsResponse::playedCount).reversed())
				.thenComparing(MemberStatisticsResponse::memberName))
			.toList();
	}

	public MemberStatisticsResponse findMemberStatistics(Long memberId, String scope, Integer year, Integer month) {
		Member member = getMember(memberId);
		return calculateMemberStatistics(member, false, createFilter(scope, year, month));
	}

	public List<MemberSynergyResponse> findMemberSynergies(Long memberId, String scope, Integer year, Integer month) {
		Member baseMember = getMember(memberId);
		StatisticsFilter filter = createFilter(scope, year, month);

		return memberRepository.findAll().stream()
			.filter(member -> !member.getId().equals(baseMember.getId()))
			.filter(member -> member.getStatus() == MemberStatus.REGULAR || member.getStatus() == MemberStatus.RESTING)
			.map(member -> {
				CombinationStatisticsResponse combination = calculateCombinationStatistics(List.of(baseMember, member), filter);
				return new MemberSynergyResponse(
					member.getId(),
					member.getName(),
					combination.playedCount(),
					combination.winCount(),
					combination.lossCount(),
					combination.drawCount(),
					combination.winRate(),
					combination.averagePointsFor(),
					combination.averagePointsAgainst()
				);
			})
			.sorted(Comparator.comparing(MemberSynergyResponse::winRate).reversed()
				.thenComparing(Comparator.comparing(MemberSynergyResponse::playedCount).reversed())
				.thenComparing(MemberSynergyResponse::memberName))
			.toList();
	}

	public StatisticsOverviewResponse findOverview(String scope, Integer year, Integer month) {
		StatisticsFilter filter = createFilter(scope, year, month);
		long minimumPlayedCount = minimumDuoPlayedCount(scope);
		List<CombinationStatisticsResponse> duos = calculateDuoStatistics(filter);

		List<CombinationStatisticsResponse> eligibleDuos = duos.stream()
			.filter(duo -> duo.playedCount() >= minimumPlayedCount)
			.toList();

		CombinationStatisticsResponse bestDuo = eligibleDuos.stream()
			.max(Comparator.comparing(CombinationStatisticsResponse::winRate)
				.thenComparing(CombinationStatisticsResponse::playedCount)
				.thenComparing(CombinationStatisticsResponse::averagePointsFor))
			.orElse(null);
		CombinationStatisticsResponse bestScoringDuo = eligibleDuos.stream()
			.max(Comparator.comparing(CombinationStatisticsResponse::averagePointsFor)
				.thenComparing(CombinationStatisticsResponse::playedCount)
				.thenComparing(CombinationStatisticsResponse::winRate))
			.orElse(null);
		CombinationStatisticsResponse bestDefenseDuo = eligibleDuos.stream()
			.min(Comparator.comparing(CombinationStatisticsResponse::averagePointsAgainst)
				.thenComparing(Comparator.comparing(CombinationStatisticsResponse::winRate).reversed())
				.thenComparing(Comparator.comparing(CombinationStatisticsResponse::playedCount).reversed()))
			.orElse(null);
		CombinationStatisticsResponse mostPlayedDuo = duos.stream()
			.max(Comparator.comparing(CombinationStatisticsResponse::playedCount)
				.thenComparing(CombinationStatisticsResponse::winRate)
				.thenComparing(CombinationStatisticsResponse::averagePointsFor))
			.orElse(null);

		return new StatisticsOverviewResponse(bestDuo, bestScoringDuo, bestDefenseDuo, mostPlayedDuo);
	}

	private List<CombinationStatisticsResponse> calculateDuoStatistics(StatisticsFilter filter) {
		List<Member> members = memberRepository.findAll().stream()
			.filter(member -> member.getStatus() == MemberStatus.REGULAR || member.getStatus() == MemberStatus.RESTING)
			.toList();
		List<CombinationStatisticsResponse> duos = new ArrayList<>();

		for (int i = 0; i < members.size(); i++) {
			for (int j = i + 1; j < members.size(); j++) {
				CombinationStatisticsResponse response = calculateCombinationStatistics(
					List.of(members.get(i), members.get(j)),
					filter
				);

				if (response.playedCount() > 0) {
					duos.add(response);
				}
			}
		}

		return duos;
	}

	private long minimumDuoPlayedCount(String scope) {
		String normalizedScope = scope == null ? "RECENT" : scope.trim().toUpperCase(Locale.ROOT);

		if ("ALL".equals(normalizedScope)) {
			return 3;
		}

		if ("MONTH".equals(normalizedScope)) {
			return 1;
		}

		return 2;
	}

	public CombinationStatisticsResponse findCombinationStatistics(List<Long> memberIds, String scope, Integer year, Integer month) {
		if (memberIds == null || memberIds.size() < 2) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least two memberIds are required");
		}

		List<Long> distinctIds = memberIds.stream().distinct().toList();
		List<Member> members = distinctIds.stream()
			.map(this::getMember)
			.toList();
		return calculateCombinationStatistics(members, createFilter(scope, year, month), true);
	}

	private CombinationStatisticsResponse calculateCombinationStatistics(List<Member> members, StatisticsFilter filter) {
		return calculateCombinationStatistics(members, filter, false);
	}

	private CombinationStatisticsResponse calculateCombinationStatistics(List<Member> members, StatisticsFilter filter,
		boolean collectRecentResults) {
		List<Long> distinctIds = members.stream().map(Member::getId).distinct().toList();
		Set<Long> targetIds = new HashSet<>(distinctIds);
		MutableStats stats = new MutableStats();

		for (Team team : teamRepository.findAll()) {
			Set<Long> teamMemberIds = memberIdsOf(team);
			if (!teamMemberIds.containsAll(targetIds)) {
				continue;
			}

			applyTeamResults(stats, team, collectRecentResults, filter);
		}

		List<RecentResultResponse> recentResults = stats.recentResults.stream()
			.sorted(Comparator.comparing(RecentResultResponse::gameDate).reversed()
				.thenComparing(Comparator.comparing(RecentResultResponse::matchNo).reversed()))
			.toList();

		return new CombinationStatisticsResponse(
			distinctIds,
			members.stream().map(Member::getName).toList(),
			stats.playedCount,
			stats.winCount,
			stats.lossCount,
			stats.drawCount,
			rate(stats.winCount, stats.playedCount),
			average(stats.pointsFor, stats.playedCount),
			average(stats.pointsAgainst, stats.playedCount),
			recentResults
		);
	}

	private MemberStatisticsResponse calculateMemberStatistics(Member member, boolean omitRecentResults, StatisticsFilter filter) {
		MutableStats stats = new MutableStats();

		for (Team team : teamRepository.findAll()) {
			if (!memberIdsOf(team).contains(member.getId())) {
				continue;
			}

			applyTeamResults(stats, team, !omitRecentResults, filter);
		}

		List<RecentResultResponse> recentResults = stats.recentResults.stream()
			.sorted(Comparator.comparing(RecentResultResponse::gameDayId).reversed()
				.thenComparing(RecentResultResponse::matchNo).reversed()
				.thenComparing(RecentResultResponse::quarterNo).reversed())
			.limit(5)
			.toList();

		return new MemberStatisticsResponse(
			member.getId(),
			member.getName(),
			stats.playedCount,
			stats.winCount,
			stats.lossCount,
			stats.drawCount,
			rate(stats.winCount, stats.playedCount),
			average(stats.pointsFor, stats.playedCount),
			average(stats.pointsAgainst, stats.playedCount),
			omitRecentResults ? List.of() : recentResults
		);
	}

	private void applyTeamResults(MutableStats stats, Team team, boolean collectRecentResults, StatisticsFilter filter) {
		if (team.getGameDay().getGameType() != GameDayType.REGULAR) {
			return;
		}

		if (!filter.matches(team.getGameDay().getId(), team.getGameDay().getGameDate())) {
			return;
		}

		List<GameResult> results = gameResultRepository.findAllByGameDayIdOrderByMatchNoAscQuarterNoAsc(
			team.getGameDay().getId());

		for (GameResult result : results) {
			if (result.getQuarterNo() != 4) {
				continue;
			}

			if (result.getTeam1Name() == team.getName()) {
				applyResult(stats, result, team.getName(), result.getTeam2Name(),
					result.getTeam1Score(), result.getTeam2Score(), result.getOutcome(), collectRecentResults);
			}

			if (result.getTeam2Name() == team.getName()) {
				ResultOutcome outcome = reverse(result.getOutcome());
				applyResult(stats, result, team.getName(), result.getTeam1Name(),
					result.getTeam2Score(), result.getTeam1Score(), outcome, collectRecentResults);
			}
		}
	}

	private void applyResult(MutableStats stats, GameResult result, TeamName teamName, TeamName opponentName,
		int pointsFor, int pointsAgainst, ResultOutcome outcome, boolean collectRecentResults) {
		stats.playedCount++;
		stats.pointsFor += pointsFor;
		stats.pointsAgainst += pointsAgainst;

		if (outcome == ResultOutcome.TEAM1_WIN) {
			stats.winCount++;
		} else if (outcome == ResultOutcome.TEAM2_WIN) {
			stats.lossCount++;
		} else {
			stats.drawCount++;
		}

		if (collectRecentResults) {
			stats.recentResults.add(toRecentResult(result, teamName, opponentName, pointsFor, pointsAgainst, outcome));
		}
	}

	private RecentResultResponse toRecentResult(GameResult result, TeamName teamName, TeamName opponentName,
		int pointsFor, int pointsAgainst, ResultOutcome outcome) {
		return new RecentResultResponse(
			result.getId(),
			result.getGameDay().getId(),
			result.getGameDay().getGameDate(),
			result.getMatchNo(),
			result.getQuarterNo(),
			teamName,
			opponentName,
			pointsFor,
			pointsAgainst,
			outcome
		);
	}

	private ResultOutcome reverse(ResultOutcome outcome) {
		if (outcome == ResultOutcome.TEAM1_WIN) {
			return ResultOutcome.TEAM2_WIN;
		}

		if (outcome == ResultOutcome.TEAM2_WIN) {
			return ResultOutcome.TEAM1_WIN;
		}

		return ResultOutcome.DRAW;
	}

	private Set<Long> memberIdsOf(Team team) {
		Set<Long> ids = new HashSet<>();

		for (TeamMember member : team.getMembers()) {
			if (member.getMember() != null) {
				ids.add(member.getMember().getId());
			}
		}

		return ids;
	}

	private Member getMember(Long id) {
		return memberRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: " + id));
	}

	private StatisticsFilter createFilter(String scope, Integer year, Integer month) {
		String normalizedScope = scope == null ? "RECENT" : scope.trim().toUpperCase(Locale.ROOT);

		if ("ALL".equals(normalizedScope)) {
			return new StatisticsFilter(null, null, Set.of());
		}

		if ("MONTH".equals(normalizedScope)) {
			if (year == null || month == null) {
				throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "year and month are required for MONTH scope");
			}

			YearMonth yearMonth = YearMonth.of(year, month);
			return new StatisticsFilter(yearMonth.atDay(1), yearMonth.atEndOfMonth(), Set.of());
		}

		if (!"RECENT".equals(normalizedScope)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported statistics scope: " + scope);
		}

		Set<Long> recentGameDayIds = teamRepository.findAll().stream()
			.filter(team -> team.getGameDay().getGameType() == GameDayType.REGULAR)
			.map(Team::getGameDay)
			.distinct()
			.sorted(Comparator.comparing(gameDay -> gameDay.getGameDate(), Comparator.reverseOrder()))
			.limit(10)
			.map(gameDay -> gameDay.getId())
			.collect(java.util.stream.Collectors.toSet());

		return new StatisticsFilter(null, null, recentGameDayIds);
	}

	private double rate(long winCount, long playedCount) {
		if (playedCount == 0) {
			return 0;
		}

		return Math.round(((double) winCount / playedCount) * 1000) / 10.0;
	}

	private double average(long total, long count) {
		if (count == 0) {
			return 0;
		}

		return Math.round(((double) total / count) * 10) / 10.0;
	}

	private static class MutableStats {
		private long playedCount;
		private long winCount;
		private long lossCount;
		private long drawCount;
		private long pointsFor;
		private long pointsAgainst;
		private final List<RecentResultResponse> recentResults = new ArrayList<>();
	}

	private record StatisticsFilter(LocalDate startDate, LocalDate endDate, Set<Long> gameDayIds) {

		private boolean matches(Long gameDayId, LocalDate gameDate) {
			if (!gameDayIds.isEmpty()) {
				return gameDayIds.contains(gameDayId);
			}

			if (startDate != null && gameDate.isBefore(startDate)) {
				return false;
			}

			return endDate == null || !gameDate.isAfter(endDate);
		}
	}
}
