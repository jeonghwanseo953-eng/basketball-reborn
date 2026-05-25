package com.seo.reborn.auth.dto;

import com.seo.reborn.auth.domain.KakaoAccount;
import com.seo.reborn.member.domain.Member;

public record AuthResponse(
	String token,
	String kakaoId,
	String nickname,
	Long memberId,
	String memberName,
	boolean linked
) {

	public static AuthResponse of(String token, KakaoAccount account) {
		Member member = account.getMember();
		return new AuthResponse(
			token,
			account.getKakaoId(),
			account.getNickname(),
			member == null ? null : member.getId(),
			member == null ? null : member.getName(),
			member != null
		);
	}
}
