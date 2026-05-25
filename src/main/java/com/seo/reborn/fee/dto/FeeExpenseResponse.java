package com.seo.reborn.fee.dto;

import com.seo.reborn.fee.domain.FeeExpense;
import java.time.LocalDate;

public record FeeExpenseResponse(
	Long id,
	Long feeMonthId,
	String title,
	int amount,
	LocalDate expenseDate,
	String memo
) {

	public static FeeExpenseResponse from(FeeExpense expense) {
		return new FeeExpenseResponse(
			expense.getId(),
			expense.getFeeMonth().getId(),
			expense.getTitle(),
			expense.getAmount(),
			expense.getExpenseDate(),
			expense.getMemo()
		);
	}
}
