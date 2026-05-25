package com.seo.reborn.result.controller;

import com.seo.reborn.result.dto.GameResultRequest;
import com.seo.reborn.result.dto.GameResultResponse;
import com.seo.reborn.result.service.GameResultService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game-results")
public class GameResultController {

	private final GameResultService gameResultService;

	public GameResultController(GameResultService gameResultService) {
		this.gameResultService = gameResultService;
	}

	@GetMapping
	public List<GameResultResponse> findAll(@RequestParam(required = false) Long gameDayId) {
		return gameResultService.findAll(gameDayId);
	}

	@GetMapping("/{id}")
	public GameResultResponse findById(@PathVariable Long id) {
		return gameResultService.findById(id);
	}

	@PostMapping
	public ResponseEntity<GameResultResponse> create(@Valid @RequestBody GameResultRequest request) {
		GameResultResponse response = gameResultService.create(request);
		return ResponseEntity.created(URI.create("/api/game-results/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public GameResultResponse update(@PathVariable Long id, @Valid @RequestBody GameResultRequest request) {
		return gameResultService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		gameResultService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
