package com.seo.reborn.fee.dto;

public record FeeSummaryResponse(
	Long feeMonthId,
	int totalIncome,
	int totalExpense,
	int balance,
	long paidCount,
	long unpaidCount
) {
}
