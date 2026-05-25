package com.seo.reborn.fee.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record FeeMonthRequest(
	@Min(2000)
	@Max(2100)
	int year,

	@Min(1)
	@Max(12)
	int month,

	@Min(0)
	int roundCount,

	@Min(0)
	int regularFeeAmount,

	@Min(0)
	int guestFeeAmount,

	@Size(max = 500)
	String memo
) {
}
