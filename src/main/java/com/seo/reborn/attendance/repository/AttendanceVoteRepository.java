package com.seo.reborn.attendance.repository;

import com.seo.reborn.attendance.domain.AttendanceStatus;
import com.seo.reborn.attendance.domain.AttendanceVote;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceVoteRepository extends JpaRepository<AttendanceVote, Long> {

	List<AttendanceVote> findAllByGameDay_Id(Long gameDayId);

	long countByGameDay_IdAndStatus(Long gameDayId, AttendanceStatus status);

	boolean existsByGameDay_IdAndMember_Id(Long gameDayId, Long memberId);

	boolean existsByGameDay_IdAndMember_IdAndIdNot(Long gameDayId, Long memberId, Long id);

	boolean existsByGameDay_IdAndVoterNameIgnoreCase(Long gameDayId, String voterName);

	boolean existsByGameDay_IdAndVoterNameIgnoreCaseAndIdNot(Long gameDayId, String voterName, Long id);
}
