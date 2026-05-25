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
class AttendanceVoteApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void manageAttendanceVotes() throws Exception {
		createGameDay();
		createMember();

		String memberVote = """
			{
			  "gameDayId": 1,
			  "memberId": 1,
			  "status": "ATTENDING",
			  "memo": "참석"
			}
			""";

		mockMvc.perform(post("/api/attendance-votes")
				.contentType(MediaType.APPLICATION_JSON)
				.content(memberVote))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", "/api/attendance-votes/1"))
			.andExpect(jsonPath("$.id").value(1))
			.andExpect(jsonPath("$.memberId").value(1))
			.andExpect(jsonPath("$.voterName").value("서장훈"))
			.andExpect(jsonPath("$.status").value("ATTENDING"));

		String guestVote = """
			{
			  "gameDayId": 1,
			  "voterName": "게스트A",
			  "status": "UNDECIDED",
			  "memo": "늦게 확정"
			}
			""";

		mockMvc.perform(post("/api/attendance-votes")
				.contentType(MediaType.APPLICATION_JSON)
				.content(guestVote))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.voterName").value("게스트A"))
			.andExpect(jsonPath("$.status").value("UNDECIDED"));

		mockMvc.perform(get("/api/attendance-votes?gameDayId=1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(2)));

		mockMvc.perform(get("/api/attendance-votes/summary?gameDayId=1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.attendingCount").value(1))
			.andExpect(jsonPath("$.absentCount").value(0))
			.andExpect(jsonPath("$.undecidedCount").value(1))
			.andExpect(jsonPath("$.totalCount").value(2));

		String updateVote = """
			{
			  "gameDayId": 1,
			  "voterName": "게스트A",
			  "status": "ABSENT",
			  "memo": "불참 변경"
			}
			""";

		mockMvc.perform(put("/api/attendance-votes/2")
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateVote))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("ABSENT"));

		mockMvc.perform(delete("/api/attendance-votes/2"))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/attendance-votes?gameDayId=1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(1)));
	}

	@Test
	void rejectDuplicateVotesInSameGameDay() throws Exception {
		createGameDay();
		createMember();

		String memberVote = """
			{
			  "gameDayId": 1,
			  "memberId": 1,
			  "status": "ATTENDING",
			  "memo": "참석"
			}
			""";

		mockMvc.perform(post("/api/attendance-votes")
				.contentType(MediaType.APPLICATION_JSON)
				.content(memberVote))
			.andExpect(status().isCreated());

		mockMvc.perform(post("/api/attendance-votes")
				.contentType(MediaType.APPLICATION_JSON)
				.content(memberVote))
			.andExpect(status().isConflict());

		String guestVote = """
			{
			  "gameDayId": 1,
			  "voterName": "게스트A",
			  "status": "UNDECIDED",
			  "memo": "늦게 확정"
			}
			""";

		mockMvc.perform(post("/api/attendance-votes")
				.contentType(MediaType.APPLICATION_JSON)
				.content(guestVote))
			.andExpect(status().isCreated());

		String duplicatedGuestVote = """
			{
			  "gameDayId": 1,
			  "voterName": "게스트a",
			  "status": "ABSENT",
			  "memo": "중복"
			}
			""";

		mockMvc.perform(post("/api/attendance-votes")
				.contentType(MediaType.APPLICATION_JSON)
				.content(duplicatedGuestVote))
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

	private void createMember() throws Exception {
		String request = """
			{
			  "name": "서장훈",
			  "birthYear": 1974,
			  "height": 207,
			  "position": "센터",
			  "region": "서울",
			  "status": "REGULAR",
			  "memo": "테스트 회원"
			}
			""";

		mockMvc.perform(post("/api/members")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isCreated());
	}
}
