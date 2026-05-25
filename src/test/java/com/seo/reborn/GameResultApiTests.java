package com.seo.reborn;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
class GameResultApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void manageGameResults() throws Exception {
		createGameDay();

		String createRequest = """
			{
			  "gameDayId": 1,
			  "matchNo": 1,
			  "quarterNo": 1,
			  "team1Name": "BLACK",
			  "team2Name": "RED",
			  "team1Score": 12,
			  "team2Score": 10,
			  "memo": "1쿼터"
			}
			""";

		mockMvc.perform(post("/api/game-results")
				.contentType(MediaType.APPLICATION_JSON)
				.content(createRequest))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", "/api/game-results/1"))
			.andExpect(jsonPath("$.id").value(1))
			.andExpect(jsonPath("$.team1Name").value("BLACK"))
			.andExpect(jsonPath("$.team2Name").value("RED"))
			.andExpect(jsonPath("$.outcome").value("TEAM1_WIN"));

		mockMvc.perform(get("/api/game-results?gameDayId=1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(1)))
			.andExpect(jsonPath("$[0].quarterNo").value(1));

		String updateRequest = """
			{
			  "gameDayId": 1,
			  "matchNo": 1,
			  "quarterNo": 1,
			  "team1Name": "BLACK",
			  "team2Name": "RED",
			  "team1Score": 8,
			  "team2Score": 11,
			  "memo": "점수 수정"
			}
			""";

		mockMvc.perform(put("/api/game-results/1")
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateRequest))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.team1Score").value(8))
			.andExpect(jsonPath("$.team2Score").value(11))
			.andExpect(jsonPath("$.outcome").value("TEAM2_WIN"));

		mockMvc.perform(delete("/api/game-results/1"))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/game-results?gameDayId=1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void rejectInvalidGameResults() throws Exception {
		createGameDay();

		String createRequest = """
			{
			  "gameDayId": 1,
			  "matchNo": 1,
			  "quarterNo": 1,
			  "team1Name": "BLACK",
			  "team2Name": "RED",
			  "team1Score": 12,
			  "team2Score": 10,
			  "memo": "1쿼터"
			}
			""";

		mockMvc.perform(post("/api/game-results")
				.contentType(MediaType.APPLICATION_JSON)
				.content(createRequest))
			.andExpect(status().isCreated());

		mockMvc.perform(post("/api/game-results")
				.contentType(MediaType.APPLICATION_JSON)
				.content(createRequest))
			.andExpect(status().isConflict());

		String sameTeamRequest = """
			{
			  "gameDayId": 1,
			  "matchNo": 1,
			  "quarterNo": 2,
			  "team1Name": "BLACK",
			  "team2Name": "BLACK",
			  "team1Score": 10,
			  "team2Score": 9,
			  "memo": "같은 팀"
			}
			""";

		mockMvc.perform(post("/api/game-results")
				.contentType(MediaType.APPLICATION_JSON)
				.content(sameTeamRequest))
			.andExpect(status().isBadRequest());

		String negativeScoreRequest = """
			{
			  "gameDayId": 1,
			  "matchNo": 1,
			  "quarterNo": 2,
			  "team1Name": "BLACK",
			  "team2Name": "RED",
			  "team1Score": -1,
			  "team2Score": 9,
			  "memo": "음수"
			}
			""";

		mockMvc.perform(post("/api/game-results")
				.contentType(MediaType.APPLICATION_JSON)
				.content(negativeScoreRequest))
			.andExpect(status().isBadRequest());
	}

	@Test
	void rejectRedTeamInTwoWayGame() throws Exception {
		String gameDay = """
			{
			  "gameDate": "2026-06-01",
			  "place": "구로 체육관",
			  "startTime": "20:00",
			  "endTime": "22:00",
			  "mode": "TWO_WAY",
			  "status": "SCHEDULED",
			  "memo": "2파전"
			}
			""";

		mockMvc.perform(post("/api/game-days")
				.contentType(MediaType.APPLICATION_JSON)
				.content(gameDay))
			.andExpect(status().isCreated());

		String result = """
			{
			  "gameDayId": 1,
			  "matchNo": 1,
			  "quarterNo": 1,
			  "team1Name": "BLACK",
			  "team2Name": "RED",
			  "team1Score": 12,
			  "team2Score": 10,
			  "memo": "2파전 레드 오류"
			}
			""";

		mockMvc.perform(post("/api/game-results")
				.contentType(MediaType.APPLICATION_JSON)
				.content(result))
			.andExpect(status().isBadRequest());
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
}
