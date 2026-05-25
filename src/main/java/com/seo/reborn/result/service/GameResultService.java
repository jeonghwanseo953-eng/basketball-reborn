package com.seo.reborn.result.service;

import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.gameday.domain.GameDayMode;
import com.seo.reborn.gameday.domain.GameDayStatus;
import com.seo.reborn.gameday.domain.GameDayType;
import com.seo.reborn.gameday.repository.GameDayRepository;
import com.seo.reborn.result.domain.GameResult;
import com.seo.reborn.result.dto.GameResultRequest;
import com.seo.reborn.result.dto.GameResultResponse;
import com.seo.reborn.result.repository.GameResultRepository;
import com.seo.reborn.team.domain.TeamName;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class GameResultService {

	private final GameResultRepository gameResultRepository;
	private final GameDayRepository gameDayRepository;

	public GameResultService(GameResultRepository gameResultRepository, GameDayRepository gameDayRepository) {
		this.gameResultRepository = gameResultRepository;
		this.gameDayRepository = gameDayRepository;
	}

	public List<GameResultResponse> findAll(Long gameDayId) {
		if (gameDayId == null) {
			return gameResultRepository.findAll().stream()
				.map(GameResultResponse::from)
				.toList();
		}

		return gameResultRepository.findAllByGameDayIdOrderByMatchNoAscQuarterNoAsc(gameDayId).stream()
			.map(GameResultResponse::from)
			.toList();
	}

	public GameResultResponse findById(Long id) {
		return GameResultResponse.from(getResult(id));
	}

	@Transactional
	public GameResultResponse create(GameResultRequest request) {
		GameDay gameDay = getGameDay(request.gameDayId());
		validateRegularGame(gameDay);
		validateTeams(gameDay, request);
		validateDuplicate(null, request);
		GameResult result = GameResult.create(
			gameDay,
			request.matchNo(),
			request.quarterNo(),
			request.team1Name(),
			request.team2Name(),
			request.team1Score(),
			request.team2Score(),
			request.memo()
		);

		return GameResultResponse.from(gameResultRepository.save(result));
	}

	@Transactional
	public GameResultResponse update(Long id, GameResultRequest request) {
		GameResult result = getResult(id);
		GameDay gameDay = getGameDay(request.gameDayId());
		validateRegularGame(gameDay);
		validateTeams(gameDay, request);
		validateDuplicate(id, request);

		result.update(
			gameDay,
			request.matchNo(),
			request.quarterNo(),
			request.team1Name(),
			request.team2Name(),
			request.team1Score(),
			request.team2Score(),
			request.memo()
		);

		return GameResultResponse.from(result);
	}

	@Transactional
	public void delete(Long id) {
		if (!gameResultRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "GameResult not found: " + id);
		}

		gameResultRepository.deleteById(id);
	}

	private GameResult getResult(Long id) {
		return gameResultRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GameResult not found: " + id));
	}

	private GameDay getGameDay(Long id) {
		return gameDayRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GameDay not found: " + id));
	}

	private void validateTeams(GameDay gameDay, GameResultRequest request) {
		if (request.team1Name() == request.team2Name()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "team1Name and team2Name must be different");
		}

		if (gameDay.getMode() == GameDayMode.TWO_WAY
			&& (request.team1Name() == TeamName.RED || request.team2Name() == TeamName.RED)) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "RED team is not allowed in two-way games");
		}
	}

	private void validateRegularGame(GameDay gameDay) {
		if (gameDay.getGameType() != GameDayType.REGULAR) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "교류전은 결과를 기록하지 않습니다.");
		}

		if (gameDay.getStatus() == GameDayStatus.HOLIDAY || gameDay.getStatus() == GameDayStatus.CLOSED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "휴무 또는 마감된 경기는 결과를 기록하지 않습니다.");
		}
	}

	private void validateDuplicate(Long currentResultId, GameResultRequest request) {
		boolean duplicated = currentResultId == null
			? gameResultRepository.existsByGameDayIdAndMatchNoAndQuarterNo(
				request.gameDayId(),
				request.matchNo(),
				request.quarterNo()
			)
			: gameResultRepository.existsByGameDayIdAndMatchNoAndQuarterNoAndIdNot(
				request.gameDayId(),
				request.matchNo(),
				request.quarterNo(),
				currentResultId
			);

		if (duplicated) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Game result already exists");
		}
	}
}
