package com.seo.reborn.result.repository;

import com.seo.reborn.result.domain.GameResult;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameResultRepository extends JpaRepository<GameResult, Long> {

	List<GameResult> findAllByGameDayIdOrderByMatchNoAscQuarterNoAsc(Long gameDayId);

	List<GameResult> findTop5ByQuarterNoOrderByGameDayGameDateDescMatchNoDesc(int quarterNo);

	boolean existsByGameDayIdAndMatchNoAndQuarterNo(Long gameDayId, int matchNo, int quarterNo);

	boolean existsByGameDayIdAndMatchNoAndQuarterNoAndIdNot(Long gameDayId, int matchNo, int quarterNo, Long id);
}
