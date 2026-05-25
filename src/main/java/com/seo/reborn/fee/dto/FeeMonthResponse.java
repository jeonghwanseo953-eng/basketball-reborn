package com.seo.reborn.fee.dto;

import com.seo.reborn.fee.domain.FeeMonth;
import java.time.LocalDateTime;

public record FeeMonthResponse(
	Long id,
	int year,
	int month,
	int roundCount,
	int regularFeeAmount,
	int guestFeeAmount,
	String memo,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {

	public static FeeMonthResponse from(FeeMonth feeMonth) {
		return new FeeMonthResponse(
			feeMonth.getId(),
			feeMonth.getYear(),
			feeMonth.getMonth(),
			feeMonth.getRoundCount(),
			feeMonth.getRegularFeeAmount(),
			feeMonth.getGuestFeeAmount(),
			feeMonth.getMemo(),
			feeMonth.getCreatedAt(),
			feeMonth.getUpdatedAt()
		);
	}
}
