package com.seo.reborn.fee.service;

import com.seo.reborn.fee.domain.FeeExpense;
import com.seo.reborn.fee.domain.FeeMonth;
import com.seo.reborn.fee.domain.FeePayment;
import com.seo.reborn.fee.domain.PaymentStatus;
import com.seo.reborn.fee.dto.FeeExpenseRequest;
import com.seo.reborn.fee.dto.FeeExpenseResponse;
import com.seo.reborn.fee.dto.FeeMonthRequest;
import com.seo.reborn.fee.dto.FeeMonthResponse;
import com.seo.reborn.fee.dto.FeePaymentRequest;
import com.seo.reborn.fee.dto.FeePaymentResponse;
import com.seo.reborn.fee.dto.FeeSummaryResponse;
import com.seo.reborn.fee.repository.FeeExpenseRepository;
import com.seo.reborn.fee.repository.FeeMonthRepository;
import com.seo.reborn.fee.repository.FeePaymentRepository;
import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.repository.MemberRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class FeeService {

	private final FeeMonthRepository feeMonthRepository;
	private final FeePaymentRepository feePaymentRepository;
	private final FeeExpenseRepository feeExpenseRepository;
	private final MemberRepository memberRepository;

	public FeeService(FeeMonthRepository feeMonthRepository, FeePaymentRepository feePaymentRepository,
		FeeExpenseRepository feeExpenseRepository, MemberRepository memberRepository) {
		this.feeMonthRepository = feeMonthRepository;
		this.feePaymentRepository = feePaymentRepository;
		this.feeExpenseRepository = feeExpenseRepository;
		this.memberRepository = memberRepository;
	}

	public List<FeeMonthResponse> findMonths() {
		return feeMonthRepository.findAllByOrderByYearDescMonthDesc().stream()
			.map(FeeMonthResponse::from)
			.toList();
	}

	public FeeMonthResponse findMonth(Long id) {
		return FeeMonthResponse.from(getFeeMonth(id));
	}

	@Transactional
	public FeeMonthResponse createMonth(FeeMonthRequest request) {
		FeeMonth feeMonth = FeeMonth.create(
			request.year(),
			request.month(),
			request.roundCount(),
			request.regularFeeAmount(),
			request.guestFeeAmount(),
			request.memo()
		);

		return FeeMonthResponse.from(feeMonthRepository.save(feeMonth));
	}

	@Transactional
	public FeeMonthResponse updateMonth(Long id, FeeMonthRequest request) {
		FeeMonth feeMonth = getFeeMonth(id);
		feeMonth.update(
			request.year(),
			request.month(),
			request.roundCount(),
			request.regularFeeAmount(),
			request.guestFeeAmount(),
			request.memo()
		);

		return FeeMonthResponse.from(feeMonth);
	}

	@Transactional
	public void deleteMonth(Long id) {
		if (!feeMonthRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "FeeMonth not found: " + id);
		}

		feeMonthRepository.deleteById(id);
	}

	public List<FeePaymentResponse> findPayments(Long feeMonthId) {
		return feePaymentRepository.findAllByFeeMonthId(feeMonthId).stream()
			.map(FeePaymentResponse::from)
			.toList();
	}

	@Transactional
	public FeePaymentResponse createPayment(FeePaymentRequest request) {
		FeeMonth feeMonth = getFeeMonth(request.feeMonthId());
		Member member = getMemberOrNull(request.memberId());
		String payerName = resolvePayerName(member, request.payerName());
		FeePayment payment = FeePayment.create(
			feeMonth,
			member,
			payerName,
			request.amount(),
			request.status(),
			request.paidDate(),
			request.memo()
		);

		return FeePaymentResponse.from(feePaymentRepository.save(payment));
	}

	@Transactional
	public FeePaymentResponse updatePayment(Long id, FeePaymentRequest request) {
		FeePayment payment = getPayment(id);
		FeeMonth feeMonth = getFeeMonth(request.feeMonthId());
		Member member = getMemberOrNull(request.memberId());
		String payerName = resolvePayerName(member, request.payerName());

		payment.update(
			feeMonth,
			member,
			payerName,
			request.amount(),
			request.status(),
			request.paidDate(),
			request.memo()
		);

		return FeePaymentResponse.from(payment);
	}

	@Transactional
	public void deletePayment(Long id) {
		if (!feePaymentRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "FeePayment not found: " + id);
		}

		feePaymentRepository.deleteById(id);
	}

	public List<FeeExpenseResponse> findExpenses(Long feeMonthId) {
		return feeExpenseRepository.findAllByFeeMonthId(feeMonthId).stream()
			.map(FeeExpenseResponse::from)
			.toList();
	}

	@Transactional
	public FeeExpenseResponse createExpense(FeeExpenseRequest request) {
		FeeMonth feeMonth = getFeeMonth(request.feeMonthId());
		FeeExpense expense = FeeExpense.create(
			feeMonth,
			request.title(),
			request.amount(),
			request.expenseDate(),
			request.memo()
		);

		return FeeExpenseResponse.from(feeExpenseRepository.save(expense));
	}

	@Transactional
	public FeeExpenseResponse updateExpense(Long id, FeeExpenseRequest request) {
		FeeExpense expense = getExpense(id);
		FeeMonth feeMonth = getFeeMonth(request.feeMonthId());
		expense.update(
			feeMonth,
			request.title(),
			request.amount(),
			request.expenseDate(),
			request.memo()
		);

		return FeeExpenseResponse.from(expense);
	}

	@Transactional
	public void deleteExpense(Long id) {
		if (!feeExpenseRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "FeeExpense not found: " + id);
		}

		feeExpenseRepository.deleteById(id);
	}

	public FeeSummaryResponse summarize(Long feeMonthId) {
		getFeeMonth(feeMonthId);
		List<FeePayment> payments = feePaymentRepository.findAllByFeeMonthId(feeMonthId);
		List<FeeExpense> expenses = feeExpenseRepository.findAllByFeeMonthId(feeMonthId);
		int totalIncome = payments.stream()
			.filter(payment -> payment.getStatus() == PaymentStatus.PAID)
			.mapToInt(FeePayment::getAmount)
			.sum();
		int totalExpense = expenses.stream()
			.mapToInt(FeeExpense::getAmount)
			.sum();

		return new FeeSummaryResponse(
			feeMonthId,
			totalIncome,
			totalExpense,
			totalIncome - totalExpense,
			feePaymentRepository.countByFeeMonthIdAndStatus(feeMonthId, PaymentStatus.PAID),
			feePaymentRepository.countByFeeMonthIdAndStatus(feeMonthId, PaymentStatus.UNPAID)
		);
	}

	private FeeMonth getFeeMonth(Long id) {
		return feeMonthRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FeeMonth not found: " + id));
	}

	private FeePayment getPayment(Long id) {
		return feePaymentRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FeePayment not found: " + id));
	}

	private FeeExpense getExpense(Long id) {
		return feeExpenseRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "FeeExpense not found: " + id));
	}

	private Member getMemberOrNull(Long id) {
		if (id == null) {
			return null;
		}

		return memberRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: " + id));
	}

	private String resolvePayerName(Member member, String payerName) {
		if (member != null) {
			return null;
		}

		if (payerName == null || payerName.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "memberId or payerName is required");
		}

		return payerName.trim();
	}
}
