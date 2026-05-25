package com.seo.reborn.fee.domain;

import com.seo.reborn.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "fee_payments")
public class FeePayment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "fee_month_id", nullable = false)
	private FeeMonth feeMonth;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "member_id")
	private Member member;

	@Column(length = 50)
	private String payerName;

	@Column(nullable = false)
	private int amount;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private PaymentStatus status;

	private LocalDate paidDate;

	@Column(length = 500)
	private String memo;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected FeePayment() {
	}

	private FeePayment(FeeMonth feeMonth, Member member, String payerName, int amount,
		PaymentStatus status, LocalDate paidDate, String memo) {
		this.feeMonth = feeMonth;
		this.member = member;
		this.payerName = payerName;
		this.amount = amount;
		this.status = status;
		this.paidDate = paidDate;
		this.memo = memo;
	}

	public static FeePayment create(FeeMonth feeMonth, Member member, String payerName, int amount,
		PaymentStatus status, LocalDate paidDate, String memo) {
		return new FeePayment(feeMonth, member, payerName, amount,
			status == null ? PaymentStatus.UNPAID : status, paidDate, memo);
	}

	public void update(FeeMonth feeMonth, Member member, String payerName, int amount,
		PaymentStatus status, LocalDate paidDate, String memo) {
		this.feeMonth = feeMonth;
		this.member = member;
		this.payerName = payerName;
		this.amount = amount;
		this.status = status == null ? PaymentStatus.UNPAID : status;
		this.paidDate = paidDate;
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

	public FeeMonth getFeeMonth() {
		return feeMonth;
	}

	public Member getMember() {
		return member;
	}

	public String getPayerName() {
		return payerName;
	}

	public int getAmount() {
		return amount;
	}

	public PaymentStatus getStatus() {
		return status;
	}

	public LocalDate getPaidDate() {
		return paidDate;
	}

	public String getMemo() {
		return memo;
	}
}
