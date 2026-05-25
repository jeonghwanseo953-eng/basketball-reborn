package com.seo.reborn;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
class StatisticsApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void calculateMemberAndCombinationStatistics() throws Exception {
		createGameDay();
		createMember("서장훈", 207, "센터");
		createMember("허재", 188, "가드");
		createTeam();
		createResult(1, 1, 12, 10);
		createResult(1, 4, 41, 38);
		createResult(2, 4, 39, 42);

		mockMvc.perform(get("/api/statistics/members/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.memberName").value("서장훈"))
			.andExpect(jsonPath("$.playedCount").value(2))
			.andExpect(jsonPath("$.winCount").value(1))
			.andExpect(jsonPath("$.lossCount").value(1))
			.andExpect(jsonPath("$.drawCount").value(0))
			.andExpect(jsonPath("$.winRate").value(50.0))
			.andExpect(jsonPath("$.averagePointsFor").value(40.0))
			.andExpect(jsonPath("$.averagePointsAgainst").value(40.0))
			.andExpect(jsonPath("$.recentResults", hasSize(2)));

		mockMvc.perform(get("/api/statistics/combinations?memberIds=1,2"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.memberIds", hasSize(2)))
			.andExpect(jsonPath("$.playedCount").value(2))
			.andExpect(jsonPath("$.winRate").value(50.0));

		mockMvc.perform(get("/api/statistics/members"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(2)));
	}

	private void createGameDay() throws Exception {
		String request = """
			{
			  "gameDate": "2026-06-01",
			  "place": "구로 체육관",
			  "startTime": "20:00",
			  "endTime": "22:00",
			  "mode": "THREE_WAY",
			  "status": "SCHEDULED",
			  "memo": "정기 운동"
			}
			""";

		mockMvc.perform(post("/api/game-days")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated());
	}

	private void createMember(String name, int height, String position) throws Exception {
		String request = """
			{
			  "name": "%s",
			  "birthYear": 1980,
			  "height": %d,
			  "position": "%s",
			  "region": "서울",
			  "status": "REGULAR",
			  "memo": "테스트 회원"
			}
			""".formatted(name, height, position);

		mockMvc.perform(post("/api/members")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated());
	}

	private void createTeam() throws Exception {
		String request = """
			{
			  "gameDayId": 1,
			  "name": "BLACK",
			  "captainMemberId": 1,
			  "memo": "블랙팀",
			  "members": [
			    { "memberId": 1 },
			    { "memberId": 2 }
			  ]
			}
			""";

		mockMvc.perform(post("/api/teams")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated());
	}

	private void createResult(int matchNo, int quarterNo, int team1Score, int team2Score) throws Exception {
		String request = """
			{
			  "gameDayId": 1,
			  "matchNo": %d,
			  "quarterNo": %d,
			  "team1Name": "BLACK",
			  "team2Name": "RED",
			  "team1Score": %d,
			  "team2Score": %d,
			  "memo": "테스트 결과"
			}
			""".formatted(matchNo, quarterNo, team1Score, team2Score);

		mockMvc.perform(post("/api/game-results")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated());
	}
}
