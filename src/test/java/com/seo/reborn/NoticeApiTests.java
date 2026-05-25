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
class NoticeApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void manageNotices() throws Exception {
		String normalNotice = """
			{
			  "title": "정기 운동 공지",
			  "content": "월요일 20시에 시작합니다.",
			  "authorName": "운영자",
			  "pinned": false
			}
			""";

		mockMvc.perform(post("/api/notices")
				.contentType(MediaType.APPLICATION_JSON)
				.content(normalNotice))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", "/api/notices/1"))
			.andExpect(jsonPath("$.title").value("정기 운동 공지"))
			.andExpect(jsonPath("$.pinned").value(false));

		String pinnedNotice = """
			{
			  "title": "회비 공지",
			  "content": "이번 달 회비를 납부해주세요.",
			  "authorName": "총무",
			  "pinned": true
			}
			""";

		mockMvc.perform(post("/api/notices")
				.contentType(MediaType.APPLICATION_JSON)
				.content(pinnedNotice))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.pinned").value(true));

		mockMvc.perform(get("/api/notices"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(2)))
			.andExpect(jsonPath("$[0].title").value("회비 공지"))
			.andExpect(jsonPath("$[0].pinned").value(true));

		String commentRequest = """
			{
			  "authorName": "김성호",
			  "content": "확인했습니다."
			}
			""";

		mockMvc.perform(post("/api/notices/2/comments")
				.contentType(MediaType.APPLICATION_JSON)
				.content(commentRequest))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", "/api/notices/2/comments/1"))
			.andExpect(jsonPath("$.noticeId").value(2))
			.andExpect(jsonPath("$.authorName").value("김성호"))
			.andExpect(jsonPath("$.content").value("확인했습니다."));

		mockMvc.perform(get("/api/notices/2/comments"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(1)))
			.andExpect(jsonPath("$[0].content").value("확인했습니다."));

		mockMvc.perform(delete("/api/notices/2/comments/1"))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/notices/2/comments"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(0)));

		String updateRequest = """
			{
			  "title": "회비 공지 수정",
			  "content": "이번 달 회비와 게스트비를 확인해주세요.",
			  "authorName": "총무",
			  "pinned": true
			}
			""";

		mockMvc.perform(put("/api/notices/2")
				.contentType(MediaType.APPLICATION_JSON)
				.content(updateRequest))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.title").value("회비 공지 수정"));

		mockMvc.perform(delete("/api/notices/1"))
			.andExpect(status().isNoContent());

		mockMvc.perform(get("/api/notices"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(1)));
	}
}
