package com.seo.reborn.fee.controller;

import com.seo.reborn.fee.dto.FeeMonthRequest;
import com.seo.reborn.fee.dto.FeeMonthResponse;
import com.seo.reborn.fee.dto.FeeSummaryResponse;
import com.seo.reborn.fee.service.FeeService;
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
@RequestMapping("/api/fee-months")
public class FeeMonthController {

	private final FeeService feeService;

	public FeeMonthController(FeeService feeService) {
		this.feeService = feeService;
	}

	@GetMapping
	public List<FeeMonthResponse> findAll() {
		return feeService.findMonths();
	}

	@GetMapping("/{id}")
	public FeeMonthResponse findById(@PathVariable Long id) {
		return feeService.findMonth(id);
	}

	@GetMapping("/{id}/summary")
	public FeeSummaryResponse summarize(@PathVariable Long id) {
		return feeService.summarize(id);
	}

	@PostMapping
	public ResponseEntity<FeeMonthResponse> create(@Valid @RequestBody FeeMonthRequest request) {
		FeeMonthResponse response = feeService.createMonth(request);
		return ResponseEntity.created(URI.create("/api/fee-months/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public FeeMonthResponse update(@PathVariable Long id, @Valid @RequestBody FeeMonthRequest request) {
		return feeService.updateMonth(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		feeService.deleteMonth(id);
		return ResponseEntity.noContent().build();
	}
}
