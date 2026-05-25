package com.seo.reborn.gameday.repository;

import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.gameday.domain.GameDayStatus;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameDayRepository extends JpaRepository<GameDay, Long> {

	Optional<GameDay> findFirstByGameDateGreaterThanEqualAndStatusOrderByGameDateAscStartTimeAsc(
		LocalDate gameDate,
		GameDayStatus status
	);
}
