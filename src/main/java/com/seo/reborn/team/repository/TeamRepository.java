package com.seo.reborn.team.repository;

import com.seo.reborn.team.domain.Team;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {

	List<Team> findAllByGameDayId(Long gameDayId);

	long countByGameDayId(Long gameDayId);
}
