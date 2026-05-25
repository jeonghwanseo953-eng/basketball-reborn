package com.seo.reborn.fee.controller;

import com.seo.reborn.fee.dto.FeePaymentRequest;
import com.seo.reborn.fee.dto.FeePaymentResponse;
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
@RequestMapping("/api/fee-payments")
public class FeePaymentController {

	private final FeeService feeService;

	public FeePaymentController(FeeService feeService) {
		this.feeService = feeService;
	}

	@GetMapping
	public List<FeePaymentResponse> findAll(@RequestParam Long feeMonthId) {
		return feeService.findPayments(feeMonthId);
	}

	@PostMapping
	public ResponseEntity<FeePaymentResponse> create(@Valid @RequestBody FeePaymentRequest request) {
		FeePaymentResponse response = feeService.createPayment(request);
		return ResponseEntity.created(URI.create("/api/fee-payments/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public FeePaymentResponse update(@PathVariable Long id, @Valid @RequestBody FeePaymentRequest request) {
		return feeService.updatePayment(id, request);
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		feeService.deletePayment(id);
		return ResponseEntity.noContent().build();
	}
}
