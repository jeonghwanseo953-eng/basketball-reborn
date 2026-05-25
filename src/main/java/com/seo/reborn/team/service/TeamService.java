package com.seo.reborn.team.service;

import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.gameday.repository.GameDayRepository;
import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.repository.MemberRepository;
import com.seo.reborn.team.domain.Team;
import com.seo.reborn.team.domain.TeamMember;
import com.seo.reborn.team.dto.TeamMemberRequest;
import com.seo.reborn.team.dto.TeamRequest;
import com.seo.reborn.team.dto.TeamResponse;
import com.seo.reborn.team.repository.TeamRepository;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class TeamService {

	private final TeamRepository teamRepository;
	private final GameDayRepository gameDayRepository;
	private final MemberRepository memberRepository;

	public TeamService(TeamRepository teamRepository, GameDayRepository gameDayRepository,
		MemberRepository memberRepository) {
		this.teamRepository = teamRepository;
		this.gameDayRepository = gameDayRepository;
		this.memberRepository = memberRepository;
	}

	public List<TeamResponse> findAll(Long gameDayId) {
		if (gameDayId == null) {
			return teamRepository.findAll().stream()
				.map(TeamResponse::from)
				.toList();
		}

		return teamRepository.findAllByGameDayId(gameDayId).stream()
			.map(TeamResponse::from)
			.toList();
	}

	public TeamResponse findById(Long id) {
		return TeamResponse.from(getTeam(id));
	}

	@Transactional
	public TeamResponse create(TeamRequest request) {
		GameDay gameDay = getGameDay(request.gameDayId());
		Member captain = getMemberOrNull(request.captainMemberId());
		validateDuplicateMembers(null, gameDay.getId(), request.members());
		Team team = Team.create(gameDay, request.name(), captain, request.memo());
		assignMembers(team, request.members());

		return TeamResponse.from(teamRepository.save(team));
	}

	@Transactional
	public TeamResponse update(Long id, TeamRequest request) {
		Team team = getTeam(id);
		GameDay gameDay = getGameDay(request.gameDayId());
		Member captain = getMemberOrNull(request.captainMemberId());
		validateDuplicateMembers(id, gameDay.getId(), request.members());

		team.update(gameDay, request.name(), captain, request.memo());
		assignMembers(team, request.members());

		return TeamResponse.from(team);
	}

	@Transactional
	public void delete(Long id) {
		if (!teamRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found: " + id);
		}

		teamRepository.deleteById(id);
	}

	private void assignMembers(Team team, List<TeamMemberRequest> requests) {
		if (requests == null) {
			return;
		}

		for (int i = 0; i < requests.size(); i++) {
			TeamMemberRequest request = requests.get(i);
			Member member = getMemberOrNull(request.memberId());
			String playerName = resolvePlayerName(member, request.playerName());
			team.addMember(TeamMember.create(member, playerName, i + 1));
		}
	}

	private Team getTeam(Long id) {
		return teamRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found: " + id));
	}

	private GameDay getGameDay(Long id) {
		return gameDayRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GameDay not found: " + id));
	}

	private Member getMemberOrNull(Long id) {
		if (id == null) {
			return null;
		}

		return memberRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: " + id));
	}

	private String resolvePlayerName(Member member, String playerName) {
		if (member != null) {
			return null;
		}

		if (playerName == null || playerName.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "memberId or playerName is required");
		}

		return playerName.trim();
	}

	private void validateDuplicateMembers(Long currentTeamId, Long gameDayId, List<TeamMemberRequest> requests) {
		if (requests == null) {
			return;
		}

		Set<Long> requestMemberIds = new HashSet<>();
		Set<String> requestGuestNames = new HashSet<>();
		for (TeamMemberRequest request : requests) {
			Member member = getMemberOrNull(request.memberId());
			String playerName = resolvePlayerName(member, request.playerName());
			if (member != null && !requestMemberIds.add(member.getId())) {
				throwDuplicate();
			}
			if (member == null && !requestGuestNames.add(normalizeName(playerName))) {
				throwDuplicate();
			}
		}

		List<Team> existingTeams = teamRepository.findAllByGameDayId(gameDayId);
		for (Team existingTeam : existingTeams) {
			if (currentTeamId != null && currentTeamId.equals(existingTeam.getId())) {
				continue;
			}

			for (TeamMember existingMember : existingTeam.getMembers()) {
				Member member = existingMember.getMember();
				if (member != null && requestMemberIds.contains(member.getId())) {
					throwDuplicate();
				}

				String playerName = existingMember.getPlayerName();
				if (member == null && playerName != null && requestGuestNames.contains(normalizeName(playerName))) {
					throwDuplicate();
				}
			}
		}
	}

	private String normalizeName(String value) {
		return value.trim().toLowerCase(Locale.ROOT);
	}

	private void throwDuplicate() {
		throw new ResponseStatusException(HttpStatus.CONFLICT, "Team member already assigned");
	}
}
