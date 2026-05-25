package com.seo.reborn.fee.controller;

import com.seo.reborn.fee.dto.FeeExpenseRequest;
import com.seo.reborn.fee.dto.FeeExpenseResponse;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fee-expenses")
public class FeeExpenseController {

	private final FeeService feeService;

	public FeeExpenseController(FeeService feeService) {
		this.feeService = feeService;
	}

	@GetMapping
	public List<FeeExpenseResponse> findAll(@RequestParam Long feeMonthId) {
		return feeService.findExpenses(feeMonthId);
	}

	@PostMapping
	public ResponseEntity<FeeExpenseResponse> create(@Valid @RequestBody FeeExpenseRequest request) {
		FeeExpenseResponse response = feeService.createExpense(request);
		return ResponseEntity.created(URI.create("/api/fee-expenses/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public FeeExpenseResponse update(@PathVariable Long id, @Valid @RequestBody FeeExpenseRequest request) {
		return feeService.updateExpense(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		feeService.deleteExpense(id);
		return ResponseEntity.noContent().build();
	}
}
