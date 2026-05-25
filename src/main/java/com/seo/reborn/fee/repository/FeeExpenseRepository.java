package com.seo.reborn.fee.repository;

import com.seo.reborn.fee.domain.FeeExpense;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeExpenseRepository extends JpaRepository<FeeExpense, Long> {

	List<FeeExpense> findAllByFeeMonthId(Long feeMonthId);
}
