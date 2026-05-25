package com.seo.reborn.team.controller;

import com.seo.reborn.team.dto.TeamRequest;
import com.seo.reborn.team.dto.TeamResponse;
import com.seo.reborn.team.service.TeamService;
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
@RequestMapping("/api/teams")
public class TeamController {

	private final TeamService teamService;

	public TeamController(TeamService teamService) {
		this.teamService = teamService;
	}

	@GetMapping
	public List<TeamResponse> findAll(@RequestParam(required = false) Long gameDayId) {
		return teamService.findAll(gameDayId);
	}

	@GetMapping("/{id}")
	public TeamResponse findById(@PathVariable Long id) {
		return teamService.findById(id);
	}

	@PostMapping
	public ResponseEntity<TeamResponse> create(@Valid @RequestBody TeamRequest request) {
		TeamResponse response = teamService.create(request);
		return ResponseEntity.created(URI.create("/api/teams/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public TeamResponse update(@PathVariable Long id, @Valid @RequestBody TeamRequest request) {
		return teamService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		teamService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
