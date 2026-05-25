package com.seo.reborn.member.controller;

import com.seo.reborn.auth.domain.KakaoAccount;
import com.seo.reborn.auth.service.AuthService;
import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.dto.MemberProfileImageRequest;
import com.seo.reborn.member.dto.MemberRequest;
import com.seo.reborn.member.dto.MemberResponse;
import com.seo.reborn.member.service.MemberService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
public class MemberController {

	private final MemberService memberService;
	private final AuthService authService;

	public MemberController(MemberService memberService, AuthService authService) {
		this.memberService = memberService;
		this.authService = authService;
	}

	@GetMapping
	public List<MemberResponse> findAll() {
		return memberService.findAll();
	}

	@GetMapping("/{id}")
	public MemberResponse findById(@PathVariable Long id) {
		return memberService.findById(id);
	}

	@PostMapping
	public ResponseEntity<MemberResponse> create(@Valid @RequestBody MemberRequest request) {
		MemberResponse response = memberService.create(request);
		return ResponseEntity.created(URI.create("/api/members/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public MemberResponse update(@PathVariable Long id, @Valid @RequestBody MemberRequest request) {
		return memberService.update(id, request);
	}

	@PutMapping("/{id}/profile-image")
	public MemberResponse updateProfileImage(@PathVariable Long id,
		@RequestHeader("X-Reborn-Auth-Token") String token,
		@Valid @RequestBody MemberProfileImageRequest request) {
		KakaoAccount account = authService.authenticate(token);
		Member authenticatedMember = account.getMember();
		Long authenticatedMemberId = authenticatedMember == null ? null : authenticatedMember.getId();
		return memberService.updateProfileImage(id, authenticatedMemberId, request.profileImageUrl());
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(@PathVariable Long id) {
		memberService.delete(id);
		return ResponseEntity.noContent().build();
	}
}
