package com.seo.reborn.auth.controller;

import com.seo.reborn.auth.dto.AuthResponse;
import com.seo.reborn.auth.dto.KakaoCallbackRequest;
import com.seo.reborn.auth.dto.KakaoLoginUrlResponse;
import com.seo.reborn.auth.dto.LinkMemberRequest;
import com.seo.reborn.auth.service.AuthService;
import com.seo.reborn.member.dto.MemberResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthService authService;

	public AuthController(AuthService authService) {
		this.authService = authService;
	}

	@GetMapping("/kakao/login-url")
	public KakaoLoginUrlResponse kakaoLoginUrl(@RequestParam String redirectUri, @RequestParam String state) {
		return new KakaoLoginUrlResponse(authService.createLoginUrl(redirectUri, state));
	}

	@PostMapping("/kakao/callback")
	public AuthResponse kakaoCallback(@Valid @RequestBody KakaoCallbackRequest request) {
		return authService.loginWithKakaoCode(request.code(), request.redirectUri());
	}

	@PostMapping("/dev-login")
	public AuthResponse devLogin() {
		return authService.devLogin();
	}

	@PostMapping("/link-member")
	public AuthResponse linkMember(@RequestHeader("X-Reborn-Auth-Token") String token,
		@Valid @RequestBody LinkMemberRequest request) {
		return authService.linkMember(token, request.memberId());
	}

	@GetMapping("/linkable-members")
	public List<MemberResponse> findLinkableMembers(@RequestHeader("X-Reborn-Auth-Token") String token) {
		return authService.findLinkableMembers(token);
	}
}
