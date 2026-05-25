package com.seo.reborn.fee.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "fee_months")
public class FeeMonth {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "fee_year", nullable = false)
	private int year;

	@Column(name = "fee_month", nullable = false)
	private int month;

	@Column(nullable = false)
	private int roundCount;

	@Column(nullable = false)
	private int regularFeeAmount;

	@Column(nullable = false)
	private int guestFeeAmount;

	@Column(length = 500)
	private String memo;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected FeeMonth() {
	}

	private FeeMonth(int year, int month, int roundCount, int regularFeeAmount, int guestFeeAmount, String memo) {
		this.year = year;
		this.month = month;
		this.roundCount = roundCount;
		this.regularFeeAmount = regularFeeAmount;
		this.guestFeeAmount = guestFeeAmount;
		this.memo = memo;
	}

	public static FeeMonth create(int year, int month, int roundCount, int regularFeeAmount,
		int guestFeeAmount, String memo) {
		return new FeeMonth(year, month, roundCount, regularFeeAmount, guestFeeAmount, memo);
	}

	public void update(int year, int month, int roundCount, int regularFeeAmount, int guestFeeAmount, String memo) {
		this.year = year;
		this.month = month;
		this.roundCount = roundCount;
		this.regularFeeAmount = regularFeeAmount;
		this.guestFeeAmount = guestFeeAmount;
		this.memo = memo;
	}

	@PrePersist
	void prePersist() {
		LocalDateTime now = LocalDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		this.updatedAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public int getYear() {
		return year;
	}

	public int getMonth() {
		return month;
	}

	public int getRoundCount() {
		return roundCount;
	}

	public int getRegularFeeAmount() {
		return regularFeeAmount;
	}

	public int getGuestFeeAmount() {
		return guestFeeAmount;
	}

	public String getMemo() {
		return memo;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
