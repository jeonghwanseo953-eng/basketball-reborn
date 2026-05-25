package com.seo.reborn.fee.dto;

import com.seo.reborn.fee.domain.PaymentStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record FeePaymentRequest(
	@NotNull
	Long feeMonthId,

	Long memberId,

	@Size(max = 50)
	String payerName,

	@Min(0)
	int amount,

	PaymentStatus status,

	LocalDate paidDate,

	@Size(max = 500)
	String memo
) {
}
