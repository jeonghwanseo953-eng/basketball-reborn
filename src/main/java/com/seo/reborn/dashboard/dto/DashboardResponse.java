package com.seo.reborn.dashboard.dto;

import com.seo.reborn.attendance.dto.AttendanceSummaryResponse;
import com.seo.reborn.gameday.dto.GameDayResponse;
import com.seo.reborn.notice.dto.NoticeResponse;
import com.seo.reborn.result.dto.GameResultResponse;
import java.util.List;

public record DashboardResponse(
	GameDayResponse nextGameDay,
	AttendanceSummaryResponse nextGameAttendance,
	List<GameResultResponse> recentResults,
	List<NoticeResponse> notices
) {
}
