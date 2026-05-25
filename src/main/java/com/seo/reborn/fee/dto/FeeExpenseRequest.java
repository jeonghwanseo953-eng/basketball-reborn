package com.seo.reborn.fee.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record FeeExpenseRequest(
	@NotNull
	Long feeMonthId,

	@NotBlank
	@Size(max = 100)
	String title,

	@Min(0)
	int amount,

	@NotNull
	LocalDate expenseDate,

	@Size(max = 500)
	String memo
) {
}
