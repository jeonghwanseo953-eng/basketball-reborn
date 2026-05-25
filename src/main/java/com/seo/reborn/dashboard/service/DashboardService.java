package com.seo.reborn.dashboard.service;

import com.seo.reborn.attendance.domain.AttendanceStatus;
import com.seo.reborn.attendance.dto.AttendanceSummaryResponse;
import com.seo.reborn.attendance.repository.AttendanceVoteRepository;
import com.seo.reborn.dashboard.dto.DashboardResponse;
import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.gameday.domain.GameDayStatus;
import com.seo.reborn.gameday.dto.GameDayResponse;
import com.seo.reborn.gameday.repository.GameDayRepository;
import com.seo.reborn.notice.dto.NoticeResponse;
import com.seo.reborn.notice.repository.NoticeRepository;
import com.seo.reborn.result.dto.GameResultResponse;
import com.seo.reborn.result.repository.GameResultRepository;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class DashboardService {

	private final GameDayRepository gameDayRepository;
	private final AttendanceVoteRepository attendanceVoteRepository;
	private final GameResultRepository gameResultRepository;
	private final NoticeRepository noticeRepository;

	public DashboardService(GameDayRepository gameDayRepository,
		AttendanceVoteRepository attendanceVoteRepository,
		GameResultRepository gameResultRepository,
		NoticeRepository noticeRepository) {
		this.gameDayRepository = gameDayRepository;
		this.attendanceVoteRepository = attendanceVoteRepository;
		this.gameResultRepository = gameResultRepository;
		this.noticeRepository = noticeRepository;
	}

	public DashboardResponse getDashboard() {
		GameDay nextGameDay = gameDayRepository
			.findFirstByGameDateGreaterThanEqualAndStatusOrderByGameDateAscStartTimeAsc(
				LocalDate.now(),
				GameDayStatus.SCHEDULED
			)
			.orElse(null);

		return new DashboardResponse(
			nextGameDay == null ? null : GameDayResponse.from(nextGameDay),
			nextGameDay == null ? null : summarizeAttendance(nextGameDay.getId()),
			gameResultRepository.findTop5ByQuarterNoOrderByGameDayGameDateDescMatchNoDesc(4).stream()
				.map(GameResultResponse::from)
				.toList(),
			noticeRepository.findTop5ByOrderByPinnedDescCreatedAtDesc().stream()
				.map(NoticeResponse::from)
				.toList()
		);
	}

	private AttendanceSummaryResponse summarizeAttendance(Long gameDayId) {
		long attendingCount = attendanceVoteRepository.countByGameDay_IdAndStatus(
			gameDayId,
			AttendanceStatus.ATTENDING
		);
		long absentCount = attendanceVoteRepository.countByGameDay_IdAndStatus(
			gameDayId,
			AttendanceStatus.ABSENT
		);
		long undecidedCount = attendanceVoteRepository.countByGameDay_IdAndStatus(
			gameDayId,
			AttendanceStatus.UNDECIDED
		);

		return new AttendanceSummaryResponse(
			gameDayId,
			attendingCount,
			absentCount,
			undecidedCount,
			attendingCount + absentCount + undecidedCount
		);
	}
}
