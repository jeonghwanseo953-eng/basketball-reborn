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
class TeamApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void manageTeams() throws Exception {
		createGameDay();
		createMember("서장훈", 207, "센터");
		createMember("허재", 188, "가드");

		String createRequest = """
			{
			  "gameDayId": 1,
			  "name": "BLACK",
			  "captainMemberId": 1,
			  "memo": "블랙팀",
			  "members": [
			    { "memberId": 1 },
			    { "memberId": 2 },
			    { "playerName": "게스트A" }
			  ]
			}
			""";

		mockMvc.perform(post("/api/teams")
				.contentType(MediaType.APPLICATION_JSON)
				.content(createRequest))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", "/api/teams/1"))
			.andExpect(jsonPath("$.id").value(1))
			.andExpect(jsonPath("$.name").value("BLACK"))
			.andExpect(jsonPath("$.captainName").value("서장훈"))
			.andExpect(jsonPath("$.members", hasSize(3)))
			.andExpect(jsonPath("$.members[2].playerName").value("게스트A"));

		mockMvc.perform(get("/api/teams?gameDayId=1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(1)))
			.andExpect(jsonPath("$[0].members", hasSize(3)));

		String updateRequest = """
			{
			  "gameDayId": 1,
			  "name": "WHITE",
			  "captainMemberId": 2,
			  "memo": "화이트팀 변경",
			  "members": [
			    { "memberId": 2 },
			    { "playerName": "게스트B" }
			  ]
			}
			""";

		mockMvc.perform(put("/api/teams/1")
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateRequest))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("WHITE"))
			.andExpect(jsonPath("$.captainName").value("허재"))
			.andExpect(jsonPath("$.members", hasSize(2)))
			.andExpect(jsonPath("$.members[1].playerName").value("게스트B"));

		mockMvc.perform(delete("/api/teams/1"))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/teams?gameDayId=1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(0)));
	}

	@Test
	void rejectDuplicateTeamMembersInSameGameDay() throws Exception {
		createGameDay();
		createMember("서장훈", 207, "센터");
		createMember("허재", 188, "가드");

		String duplicatedInsideRequest = """
			{
			  "gameDayId": 1,
			  "name": "BLACK",
			  "captainMemberId": 1,
			  "memo": "중복",
			  "members": [
			    { "memberId": 1 },
			    { "memberId": 1 }
			  ]
			}
			""";

		mockMvc.perform(post("/api/teams")
				.contentType(MediaType.APPLICATION_JSON)
				.content(duplicatedInsideRequest))
			.andExpect(status().isConflict());

		String blackTeam = """
			{
			  "gameDayId": 1,
			  "name": "BLACK",
			  "captainMemberId": 1,
			  "memo": "블랙팀",
			  "members": [
			    { "memberId": 1 },
			    { "playerName": "게스트A" }
			  ]
			}
			""";

		mockMvc.perform(post("/api/teams")
				.contentType(MediaType.APPLICATION_JSON)
				.content(blackTeam))
			.andExpect(status().isCreated());

		String whiteTeamWithDuplicatedMember = """
			{
			  "gameDayId": 1,
			  "name": "WHITE",
			  "captainMemberId": 2,
			  "memo": "화이트팀",
			  "members": [
			    { "memberId": 1 }
			  ]
			}
			""";

		mockMvc.perform(post("/api/teams")
				.contentType(MediaType.APPLICATION_JSON)
				.content(whiteTeamWithDuplicatedMember))
			.andExpect(status().isConflict());

		String whiteTeamWithDuplicatedGuest = """
			{
			  "gameDayId": 1,
			  "name": "WHITE",
			  "captainMemberId": 2,
			  "memo": "화이트팀",
			  "members": [
			    { "playerName": "게스트a" }
			  ]
			}
			""";

		mockMvc.perform(post("/api/teams")
				.contentType(MediaType.APPLICATION_JSON)
				.content(whiteTeamWithDuplicatedGuest))
			.andExpect(status().isConflict());
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
}
