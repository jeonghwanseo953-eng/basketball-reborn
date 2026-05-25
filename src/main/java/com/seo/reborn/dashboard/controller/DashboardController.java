package com.seo.reborn.dashboard.controller;

import com.seo.reborn.dashboard.dto.DashboardResponse;
import com.seo.reborn.dashboard.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

	private final DashboardService dashboardService;

	public DashboardController(DashboardService dashboardService) {
		this.dashboardService = dashboardService;
	}

	@GetMapping
	public DashboardResponse getDashboard() {
		return dashboardService.getDashboard();
	}
}
