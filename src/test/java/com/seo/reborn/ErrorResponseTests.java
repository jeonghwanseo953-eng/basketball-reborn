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
class ErrorResponseTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void validationErrorUsesCommonFormat() throws Exception {
		String request = """
			{
			  "name": "",
			  "birthYear": 1800,
			  "height": 90,
			  "status": "REGULAR"
			}
			""";

		mockMvc.perform(post("/api/members")
				.contentType(MediaType.APPLICATION_JSON)
				.content(request))
			.andExpect(status().isBadRequest())
			.andExpect(jsonPath("$.status").value(400))
			.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"))
			.andExpect(jsonPath("$.message").value("Invalid request"))
			.andExpect(jsonPath("$.errors", hasSize(3)));
	}

	@Test
	void notFoundErrorUsesCommonFormat() throws Exception {
		mockMvc.perform(get("/api/members/999"))
			.andExpect(status().isNotFound())
			.andExpect(jsonPath("$.status").value(404))
			.andExpect(jsonPath("$.code").value("NOT_FOUND"))
			.andExpect(jsonPath("$.message").value("Member not found: 999"))
			.andExpect(jsonPath("$.errors", hasSize(0)));
	}
}
