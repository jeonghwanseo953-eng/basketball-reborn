package com.seo.reborn.fee.repository;

import com.seo.reborn.fee.domain.FeePayment;
import com.seo.reborn.fee.domain.PaymentStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeePaymentRepository extends JpaRepository<FeePayment, Long> {

	List<FeePayment> findAllByFeeMonthId(Long feeMonthId);

	long countByFeeMonthIdAndStatus(Long feeMonthId, PaymentStatus status);
}
