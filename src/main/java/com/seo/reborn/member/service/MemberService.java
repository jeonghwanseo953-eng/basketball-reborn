package com.seo.reborn.member.service;

import com.seo.reborn.auth.repository.KakaoAccountRepository;
import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.domain.MemberRole;
import com.seo.reborn.member.dto.MemberRequest;
import com.seo.reborn.member.dto.MemberResponse;
import com.seo.reborn.member.repository.MemberRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class MemberService {

	private final MemberRepository memberRepository;
	private final KakaoAccountRepository kakaoAccountRepository;

	public MemberService(MemberRepository memberRepository, KakaoAccountRepository kakaoAccountRepository) {
		this.memberRepository = memberRepository;
		this.kakaoAccountRepository = kakaoAccountRepository;
	}

	public List<MemberResponse> findAll() {
		return memberRepository.findAll().stream()
			.map(this::toResponse)
			.toList();
	}

	public MemberResponse findById(Long id) {
		return toResponse(getMember(id));
	}

	@Transactional
	public MemberResponse create(MemberRequest request) {
		validateUniqueRole(null, request.role());

		Member member = Member.create(
			request.name(),
			request.birthYear(),
			request.height(),
			request.position(),
			request.region(),
			request.role(),
			request.status(),
			request.memo(),
			request.restUntilDate()
		);

		return toResponse(memberRepository.save(member));
	}

	@Transactional
	public MemberResponse update(Long id, MemberRequest request) {
		Member member = getMember(id);
		validateUniqueRole(id, request.role());

		member.update(
			request.name(),
			request.birthYear(),
			request.height(),
			request.position(),
			request.region(),
			request.role(),
			request.status(),
			request.memo(),
			request.restUntilDate()
		);

		return toResponse(member);
	}

	@Transactional
	public MemberResponse updateProfileImage(Long id, Long authenticatedMemberId, String profileImageUrl) {
		if (authenticatedMemberId == null || !id.equals(authenticatedMemberId)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the linked member can update this profile image");
		}
		if (!kakaoAccountRepository.existsByMemberId(id)) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Kakao linked member is required");
		}
		if (profileImageUrl == null || !profileImageUrl.startsWith("data:image/")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Profile image must be an image data URL");
		}

		Member member = getMember(id);
		member.updateProfileImage(profileImageUrl);
		return toResponse(member);
	}

	private MemberResponse toResponse(Member member) {
		return MemberResponse.from(member, kakaoAccountRepository.existsByMemberId(member.getId()));
	}

	@Transactional
	public void delete(Long id) {
		if (!memberRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: " + id);
		}

		memberRepository.deleteById(id);
	}

	private Member getMember(Long id) {
		return memberRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: " + id));
	}

	private void validateUniqueRole(Long currentMemberId, MemberRole role) {
		if (role == null || role == MemberRole.NONE) {
			return;
		}

		memberRepository.findFirstByRole(role)
			.filter(member -> !member.getId().equals(currentMemberId))
			.ifPresent(member -> {
				throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					getRoleLabel(role) + " 직책은 이미 " + member.getName() + " 회원에게 지정되어 있습니다."
				);
			});
	}

	private String getRoleLabel(MemberRole role) {
		return switch (role) {
			case PRESIDENT -> "회장";
			case TREASURER -> "총무";
			case WEB_ADMIN -> "웹관리자";
			case NONE -> "직책";
		};
	}
}
