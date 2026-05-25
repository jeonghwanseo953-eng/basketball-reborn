package com.seo.reborn.auth.config;

import com.seo.reborn.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuthInterceptor implements HandlerInterceptor {

	private final AuthService authService;
	private final boolean requireWriteAuth;

	public AuthInterceptor(AuthService authService, @Value("${app.auth.require-write-auth:false}") boolean requireWriteAuth) {
		this.authService = authService;
		this.requireWriteAuth = requireWriteAuth;
	}

	@Override
	public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
		String method = request.getMethod();
		String path = request.getRequestURI();

		if (!requireWriteAuth || HttpMethod.GET.matches(method) || HttpMethod.HEAD.matches(method) || HttpMethod.OPTIONS.matches(method)
			|| path.startsWith("/api/auth/")) {
			return true;
		}

		authService.authenticate(request.getHeader("X-Reborn-Auth-Token"));
		return true;
	}
}
