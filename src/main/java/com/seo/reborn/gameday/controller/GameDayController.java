package com.seo.reborn.gameday.controller;

import com.seo.reborn.gameday.dto.GameDayRequest;
import com.seo.reborn.gameday.dto.GameDayResponse;
import com.seo.reborn.gameday.service.GameDayService;
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
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game-days")
public class GameDayController {

	private final GameDayService gameDayService;

	public GameDayController(GameDayService gameDayService) {
		this.gameDayService = gameDayService;
	}

	@GetMapping
	public List<GameDayResponse> findAll() {
		return gameDayService.findAll();
	}

	@GetMapping("/{id}")
	public GameDayResponse findById(@PathVariable Long id) {
		return gameDayService.findById(id);
	}

	@PostMapping
	public ResponseEntity<GameDayResponse> create(@Valid @RequestBody GameDayRequest request) {
		GameDayResponse response = gameDayService.create(request);
		return ResponseEntity.created(URI.create("/api/game-days/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public GameDayResponse update(@PathVariable Long id, @Valid @RequestBody GameDayRequest request) {
		return gameDayService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		gameDayService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
