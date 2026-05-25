package com.seo.reborn.fee.dto;

import com.seo.reborn.fee.domain.FeePayment;
import com.seo.reborn.fee.domain.PaymentStatus;
import java.time.LocalDate;

public record FeePaymentResponse(
	Long id,
	Long feeMonthId,
	Long memberId,
	String payerName,
	int amount,
	PaymentStatus status,
	LocalDate paidDate,
	String memo
) {

	public static FeePaymentResponse from(FeePayment payment) {
		return new FeePaymentResponse(
			payment.getId(),
			payment.getFeeMonth().getId(),
			payment.getMember() == null ? null : payment.getMember().getId(),
			payment.getMember() == null ? payment.getPayerName() : payment.getMember().getName(),
			payment.getAmount(),
			payment.getStatus(),
			payment.getPaidDate(),
			payment.getMemo()
		);
	}
}
