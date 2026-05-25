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
class GameDayApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void manageGameDays() throws Exception {
		String createRequest = """
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
				.content(createRequest))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", "/api/game-days/1"))
			.andExpect(jsonPath("$.id").value(1))
			.andExpect(jsonPath("$.place").value("구로 체육관"))
			.andExpect(jsonPath("$.mode").value("THREE_WAY"));

		mockMvc.perform(get("/api/game-days"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(1)))
			.andExpect(jsonPath("$[0].gameDate").value("2026-06-01"));

		String updateRequest = """
			{
			  "gameDate": "2026-06-01",
			  "place": "영등포 체육관",
			  "startTime": "19:30",
			  "endTime": "21:30",
			  "mode": "TWO_WAY",
			  "status": "COMPLETED",
			  "memo": "장소 변경"
			}
			""";

		mockMvc.perform(put("/api/game-days/1")
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateRequest))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.place").value("영등포 체육관"))
			.andExpect(jsonPath("$.mode").value("TWO_WAY"))
			.andExpect(jsonPath("$.status").value("COMPLETED"));

		mockMvc.perform(delete("/api/game-days/1"))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/game-days"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(0)));
	}
}
