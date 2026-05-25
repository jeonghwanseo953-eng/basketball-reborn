package com.seo.reborn;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
class DashboardApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void getDashboard() throws Exception {
		createGameDay(LocalDate.now().plusDays(1).toString(), "SCHEDULED");
		createAttendanceVote("ATTENDING");
		createAttendanceVote("ABSENT");
		createGameResult();
		createNotice("일반 공지", false);
		createNotice("고정 공지", true);

		mockMvc.perform(get("/api/dashboard"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.nextGameDay.id").value(1))
			.andExpect(jsonPath("$.nextGameAttendance.attendingCount").value(1))
			.andExpect(jsonPath("$.nextGameAttendance.absentCount").value(1))
			.andExpect(jsonPath("$.recentResults", hasSize(1)))
			.andExpect(jsonPath("$.recentResults[0].gameDate").value(LocalDate.now().plusDays(1).toString()))
			.andExpect(jsonPath("$.recentResults[0].outcome").value("TEAM1_WIN"))
			.andExpect(jsonPath("$.notices", hasSize(2)))
			.andExpect(jsonPath("$.notices[0].title").value("고정 공지"));
	}

	private void createGameDay(String gameDate, String status) throws Exception {
		String request = """
			{
			  "gameDate": "%s",
			  "place": "구로 체육관",
			  "startTime": "20:00",
			  "endTime": "22:00",
			  "mode": "THREE_WAY",
			  "status": "%s",
			  "memo": "정기 운동"
			}
			""".formatted(gameDate, status);

		mockMvc.perform(post("/api/game-days")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated());
	}

	private void createAttendanceVote(String status) throws Exception {
		String request = """
			{
			  "gameDayId": 1,
			  "voterName": "게스트-%s",
			  "status": "%s",
			  "memo": "대시보드 테스트"
			}
			""".formatted(status, status);

		mockMvc.perform(post("/api/attendance-votes")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated());
	}

	private void createGameResult() throws Exception {
		String request = """
			{
			  "gameDayId": 1,
			  "matchNo": 1,
			  "quarterNo": 4,
			  "team1Name": "BLACK",
			  "team2Name": "RED",
			  "team1Score": 12,
			  "team2Score": 10,
			  "memo": "결과"
			}
			""";

		mockMvc.perform(post("/api/game-results")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated());
	}

	private void createNotice(String title, boolean pinned) throws Exception {
		String request = """
			{
			  "title": "%s",
			  "content": "내용",
			  "authorName": "운영자",
			  "pinned": %s
			}
			""".formatted(title, pinned);

		mockMvc.perform(post("/api/notices")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated());
	}
}
