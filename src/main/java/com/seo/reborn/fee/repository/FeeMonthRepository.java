package com.seo.reborn.fee.repository;

import com.seo.reborn.fee.domain.FeeMonth;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FeeMonthRepository extends JpaRepository<FeeMonth, Long> {

	List<FeeMonth> findAllByOrderByYearDescMonthDesc();
}
