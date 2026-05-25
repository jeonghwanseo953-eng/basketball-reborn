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
class FeeApiTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void manageFees() throws Exception {
		createMember();

		String monthRequest = """
			{
			  "year": 2026,
			  "month": 6,
			  "roundCount": 4,
			  "regularFeeAmount": 40000,
			  "guestFeeAmount": 10000,
			  "memo": "6월 회비"
			}
			""";

		mockMvc.perform(post("/api/fee-months")
				.contentType(MediaType.APPLICATION_JSON)
				.content(monthRequest))
			.andExpect(status().isCreated())
			.andExpect(header().string("Location", "/api/fee-months/1"))
			.andExpect(jsonPath("$.regularFeeAmount").value(40000));

		String memberPayment = """
			{
			  "feeMonthId": 1,
			  "memberId": 1,
			  "amount": 40000,
			  "status": "PAID",
			  "paidDate": "2026-06-01",
			  "memo": "정회원 납부"
			}
			""";

		mockMvc.perform(post("/api/fee-payments")
				.contentType(MediaType.APPLICATION_JSON)
				.content(memberPayment))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.payerName").value("서장훈"))
			.andExpect(jsonPath("$.status").value("PAID"));

		String guestPayment = """
			{
			  "feeMonthId": 1,
			  "payerName": "게스트A",
			  "amount": 10000,
			  "status": "UNPAID",
			  "memo": "게스트비"
			}
			""";

		mockMvc.perform(post("/api/fee-payments")
				.contentType(MediaType.APPLICATION_JSON)
				.content(guestPayment))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.payerName").value("게스트A"));

		String expenseRequest = """
			{
			  "feeMonthId": 1,
			  "title": "대관비",
			  "amount": 30000,
			  "expenseDate": "2026-06-02",
			  "memo": "체육관"
			}
			""";

		mockMvc.perform(post("/api/fee-expenses")
				.contentType(MediaType.APPLICATION_JSON)
				.content(expenseRequest))
			.andExpect(status().isCreated())
			.andExpect(jsonPath("$.title").value("대관비"));

		mockMvc.perform(get("/api/fee-payments?feeMonthId=1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(2)));

		mockMvc.perform(get("/api/fee-expenses?feeMonthId=1"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$", hasSize(1)));

		mockMvc.perform(get("/api/fee-months/1/summary"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.totalIncome").value(40000))
			.andExpect(jsonPath("$.totalExpense").value(30000))
			.andExpect(jsonPath("$.balance").value(10000))
			.andExpect(jsonPath("$.paidCount").value(1))
			.andExpect(jsonPath("$.unpaidCount").value(1));

		String updatePayment = """
			{
			  "feeMonthId": 1,
			  "payerName": "게스트A",
			  "amount": 10000,
			  "status": "PAID",
			  "paidDate": "2026-06-03",
			  "memo": "게스트비 납부"
			}
			""";

		mockMvc.perform(put("/api/fee-payments/2")
				.contentType(MediaType.APPLICATION_JSON)
				.content(updatePayment))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.status").value("PAID"));

		mockMvc.perform(get("/api/fee-months/1/summary"))
			.andExpect(status().isOk())
			.andExpect(jsonPath("$.totalIncome").value(50000))
			.andExpect(jsonPath("$.balance").value(20000));
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
