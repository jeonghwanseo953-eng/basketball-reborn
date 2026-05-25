package com.seo.reborn.attendance.controller;

import com.seo.reborn.attendance.dto.AttendanceSummaryResponse;
import com.seo.reborn.attendance.dto.AttendanceVoteRequest;
import com.seo.reborn.attendance.dto.AttendanceVoteResponse;
import com.seo.reborn.attendance.service.AttendanceVoteService;
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
@RequestMapping("/api/attendance-votes")
public class AttendanceVoteController {

	private final AttendanceVoteService attendanceVoteService;

	public AttendanceVoteController(AttendanceVoteService attendanceVoteService) {
		this.attendanceVoteService = attendanceVoteService;
	}

	@GetMapping
	public List<AttendanceVoteResponse> findAll(@RequestParam(required = false) Long gameDayId) {
		return attendanceVoteService.findAll(gameDayId);
	}

	@GetMapping("/{id}")
	public AttendanceVoteResponse findById(@PathVariable Long id) {
		return attendanceVoteService.findById(id);
	}

	@GetMapping("/summary")
	public AttendanceSummaryResponse summarize(@RequestParam Long gameDayId) {
		return attendanceVoteService.summarize(gameDayId);
	}

	@PostMapping
	public ResponseEntity<AttendanceVoteResponse> create(@Valid @RequestBody AttendanceVoteRequest request) {
		AttendanceVoteResponse response = attendanceVoteService.create(request);
		return ResponseEntity.created(URI.create("/api/attendance-votes/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public AttendanceVoteResponse update(@PathVariable Long id, @Valid @RequestBody AttendanceVoteRequest request) {
		return attendanceVoteService.update(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		attendanceVoteService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
