package com.seo.reborn.auth.service;

import com.seo.reborn.auth.domain.AuthSession;
import com.seo.reborn.auth.domain.KakaoAccount;
import com.seo.reborn.auth.dto.AuthResponse;
import com.seo.reborn.auth.repository.AuthSessionRepository;
import com.seo.reborn.auth.repository.KakaoAccountRepository;
import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.dto.MemberResponse;
import com.seo.reborn.member.repository.MemberRepository;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AuthService {

	private final KakaoAccountRepository kakaoAccountRepository;
	private final AuthSessionRepository authSessionRepository;
	private final MemberRepository memberRepository;
	private final RestClient restClient;
	private final String kakaoRestApiKey;
	private final boolean devLoginEnabled;

	public AuthService(KakaoAccountRepository kakaoAccountRepository,
		AuthSessionRepository authSessionRepository,
		MemberRepository memberRepository,
		RestClient.Builder restClientBuilder,
		@Value("${app.kakao.rest-api-key:}") String kakaoRestApiKey,
		@Value("${app.auth.dev-login-enabled:false}") boolean devLoginEnabled) {
		this.kakaoAccountRepository = kakaoAccountRepository;
		this.authSessionRepository = authSessionRepository;
		this.memberRepository = memberRepository;
		this.restClient = restClientBuilder.build();
		this.kakaoRestApiKey = kakaoRestApiKey;
		this.devLoginEnabled = devLoginEnabled;
	}

	public String createLoginUrl(String redirectUri, String state) {
		if (kakaoRestApiKey.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kakao REST API key is not configured");
		}

		return "https://kauth.kakao.com/oauth/authorize"
			+ "?response_type=code"
			+ "&client_id=" + encode(kakaoRestApiKey)
			+ "&redirect_uri=" + encode(redirectUri)
			+ "&state=" + encode(state == null ? "" : state);
	}

	@Transactional
	public AuthResponse loginWithKakaoCode(String code, String redirectUri) {
		Map<?, ?> tokenResponse = requestKakaoToken(code, redirectUri);
		String accessToken = String.valueOf(tokenResponse.get("access_token"));
		Map<?, ?> userResponse = requestKakaoUser(accessToken);
		String kakaoId = String.valueOf(userResponse.get("id"));
		String nickname = extractNickname(userResponse);

		return createSession(upsertAccount(kakaoId, nickname));
	}

	@Transactional
	public AuthResponse devLogin() {
		if (!devLoginEnabled) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Dev login is disabled");
		}

		KakaoAccount account = upsertAccount("dev-local", "개발용 카카오");
		return createSession(account);
	}

	public KakaoAccount authenticate(String token) {
		if (token == null || token.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
		}

		return authSessionRepository.findByTokenAndExpiresAtAfter(token, LocalDateTime.now())
			.map(AuthSession::getKakaoAccount)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid auth session"));
	}

	@Transactional
	public AuthResponse linkMember(String token, Long memberId) {
		KakaoAccount account = authenticate(token);
		Member member = memberRepository.findById(memberId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: " + memberId));

		if (kakaoAccountRepository.existsByMemberIdAndIdNot(memberId, account.getId())) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 다른 카카오 계정과 연동된 회원입니다.");
		}

		account.linkMember(member);
		return createSession(account);
	}

	public List<MemberResponse> findLinkableMembers(String token) {
		authenticate(token);
		return memberRepository.findAll().stream()
			.filter(member -> !kakaoAccountRepository.existsByMemberId(member.getId()))
			.map(member -> MemberResponse.from(member, false))
			.toList();
	}

	private AuthResponse createSession(KakaoAccount account) {
		String token = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
		authSessionRepository.save(AuthSession.create(token, account, LocalDateTime.now().plusDays(30)));
		return AuthResponse.of(token, account);
	}

	private KakaoAccount upsertAccount(String kakaoId, String nickname) {
		return kakaoAccountRepository.findByKakaoId(kakaoId)
			.map(account -> {
				account.updateProfile(nickname);
				return account;
			})
			.orElseGet(() -> kakaoAccountRepository.save(KakaoAccount.create(kakaoId, nickname)));
	}

	private Map<?, ?> requestKakaoToken(String code, String redirectUri) {
		StringBuilder body = new StringBuilder()
			.append("grant_type=authorization_code")
			.append("&client_id=").append(encode(kakaoRestApiKey))
			.append("&redirect_uri=").append(encode(redirectUri))
			.append("&code=").append(encode(code));

		try {
			return restClient.post()
				.uri("https://kauth.kakao.com/oauth/token")
				.header(HttpHeaders.CONTENT_TYPE, "application/x-www-form-urlencoded;charset=utf-8")
				.body(body.toString())
				.retrieve()
				.body(Map.class);
		} catch (RestClientResponseException exception) {
			throw new ResponseStatusException(
				HttpStatus.BAD_GATEWAY,
				"Kakao token request failed: " + exception.getResponseBodyAsString()
			);
		}
	}

	private Map<?, ?> requestKakaoUser(String accessToken) {
		try {
			return restClient.get()
				.uri("https://kapi.kakao.com/v2/user/me")
				.header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
				.retrieve()
				.body(Map.class);
		} catch (RestClientResponseException exception) {
			throw new ResponseStatusException(
				HttpStatus.BAD_GATEWAY,
				"Kakao user request failed: " + exception.getResponseBodyAsString()
			);
		}
	}

	@SuppressWarnings("unchecked")
	private String extractNickname(Map<?, ?> userResponse) {
		Object account = userResponse.get("kakao_account");
		if (account instanceof Map<?, ?> accountMap) {
			Object profile = accountMap.get("profile");
			if (profile instanceof Map<?, ?> profileMap) {
				Object nickname = profileMap.get("nickname");
				if (nickname instanceof String value && !value.isBlank()) {
					return value;
				}
			}
		}

		return "카카오 사용자";
	}

	private String encode(String value) {
		return URLEncoder.encode(value, StandardCharsets.UTF_8);
	}
}
