package com.seo.reborn.fee.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "fee_expenses")
public class FeeExpense {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "fee_month_id", nullable = false)
	private FeeMonth feeMonth;

	@Column(nullable = false, length = 100)
	private String title;

	@Column(nullable = false)
	private int amount;

	@Column(nullable = false)
	private LocalDate expenseDate;

	@Column(length = 500)
	private String memo;

	protected FeeExpense() {
	}

	private FeeExpense(FeeMonth feeMonth, String title, int amount, LocalDate expenseDate, String memo) {
		this.feeMonth = feeMonth;
		this.title = title;
		this.amount = amount;
		this.expenseDate = expenseDate;
		this.memo = memo;
	}

	public static FeeExpense create(FeeMonth feeMonth, String title, int amount, LocalDate expenseDate, String memo) {
		return new FeeExpense(feeMonth, title, amount, expenseDate, memo);
	}

	public void update(FeeMonth feeMonth, String title, int amount, LocalDate expenseDate, String memo) {
		this.feeMonth = feeMonth;
		this.title = title;
		this.amount = amount;
		this.expenseDate = expenseDate;
		this.memo = memo;
	}

	public Long getId() {
		return id;
	}

	public FeeMonth getFeeMonth() {
		return feeMonth;
	}

	public String getTitle() {
		return title;
	}

	public int getAmount() {
		return amount;
	}

	public LocalDate getExpenseDate() {
		return expenseDate;
	}

	public String getMemo() {
		return memo;
	}
}
