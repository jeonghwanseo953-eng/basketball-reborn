package com.seo.reborn.gameday.service;

import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.gameday.dto.GameDayRequest;
import com.seo.reborn.gameday.dto.GameDayResponse;
import com.seo.reborn.gameday.repository.GameDayRepository;
import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.repository.MemberRepository;
import com.seo.reborn.team.repository.TeamRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class GameDayService {

	private final GameDayRepository gameDayRepository;
	private final TeamRepository teamRepository;
	private final MemberRepository memberRepository;

	public GameDayService(GameDayRepository gameDayRepository, TeamRepository teamRepository,
		MemberRepository memberRepository) {
		this.gameDayRepository = gameDayRepository;
		this.teamRepository = teamRepository;
		this.memberRepository = memberRepository;
	}

	public List<GameDayResponse> findAll() {
		return gameDayRepository.findAll().stream()
			.map(this::toResponse)
			.toList();
	}

	public GameDayResponse findById(Long id) {
		return toResponse(getGameDay(id));
	}

	@Transactional
	public GameDayResponse create(GameDayRequest request) {
		Member teamBuilder = getMemberOrNull(request.teamBuilderMemberId());
		GameDay gameDay = GameDay.create(
			request.gameDate(),
			request.place(),
			request.startTime(),
			request.endTime(),
			request.mode(),
			request.gameType(),
			request.status(),
			request.memo(),
			teamBuilder
		);

		return toResponse(gameDayRepository.save(gameDay));
	}

	@Transactional
	public GameDayResponse update(Long id, GameDayRequest request) {
		GameDay gameDay = getGameDay(id);
		Member teamBuilder = getMemberOrNull(request.teamBuilderMemberId());
		gameDay.update(
			request.gameDate(),
			request.place(),
			request.startTime(),
			request.endTime(),
			request.mode(),
			request.gameType(),
			request.status(),
			request.memo(),
			teamBuilder
		);

		return toResponse(gameDay);
	}

	@Transactional
	public void delete(Long id) {
		if (!gameDayRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "GameDay not found: " + id);
		}

		gameDayRepository.deleteById(id);
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

	private GameDayResponse toResponse(GameDay gameDay) {
		return GameDayResponse.from(gameDay, teamRepository.countByGameDayId(gameDay.getId()));
	}
}
