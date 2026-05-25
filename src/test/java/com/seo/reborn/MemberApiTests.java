package com.seo.reborn;

import static org.hamcrest.Matchers.hasSize;
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
class MemberApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void createAndFindMembers() throws Exception {
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
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", "/api/members/1"))
			.andExpect(jsonPath("$.id").value(1))
			.andExpect(jsonPath("$.name").value("서장훈"));

		mockMvc.perform(get("/api/members"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(1)))
			.andExpect(jsonPath("$[0].name").value("서장훈"));

		mockMvc.perform(get("/api/members/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.position").value("센터"));
	}

	@Test
	void updateMember() throws Exception {
		String createRequest = """
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
				.content(createRequest))
			.andExpect(status().isCreated());

		String updateRequest = """
			{
			  "name": "김훈",
			  "birthYear": 1973,
			  "height": 190,
			  "position": "가드",
			  "region": "부산",
			  "status": "RESTING",
			  "memo": "수정된 회원"
			}
			""";

		mockMvc.perform(put("/api/members/1")
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateRequest))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.id").value(1))
			.andExpect(jsonPath("$.name").value("김훈"))
			.andExpect(jsonPath("$.position").value("가드"))
			.andExpect(jsonPath("$.status").value("RESTING"));

		mockMvc.perform(get("/api/members/1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.name").value("김훈"))
			.andExpect(jsonPath("$.memo").value("수정된 회원"));
	}

	@Test
	void rejectDuplicateOperatorRole() throws Exception {
		String presidentRequest = """
			{
			  "name": "President",
			  "birthYear": 1980,
			  "height": 177,
			  "position": "포워드",
			  "region": "서울",
			  "role": "PRESIDENT",
			  "status": "REGULAR",
			  "memo": ""
			}
			""";

		mockMvc.perform(post("/api/members")
				.contentType(MediaType.APPLICATION_JSON)
				.content(presidentRequest))
			.andExpect(status().isCreated());

		String duplicatePresidentRequest = """
			{
			  "name": "Another President",
			  "birthYear": 1981,
			  "height": 180,
			  "position": "가드",
			  "region": "서울",
			  "role": "PRESIDENT",
			  "status": "REGULAR",
			  "memo": ""
			}
			""";

		mockMvc.perform(post("/api/members")
				.contentType(MediaType.APPLICATION_JSON)
				.content(duplicatePresidentRequest))
			.andExpect(status().isConflict())
			.andExpect(jsonPath("$.message").value("회장 직책은 이미 President 회원에게 지정되어 있습니다."));
	}
}
