package com.seo.reborn.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "auth_sessions")
public class AuthSession {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 80)
	private String token;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "kakao_account_id", nullable = false)
	private KakaoAccount kakaoAccount;

	@Column(nullable = false)
	private LocalDateTime expiresAt;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected AuthSession() {
	}

	private AuthSession(String token, KakaoAccount kakaoAccount, LocalDateTime expiresAt) {
		this.token = token;
		this.kakaoAccount = kakaoAccount;
		this.expiresAt = expiresAt;
	}

	public static AuthSession create(String token, KakaoAccount kakaoAccount, LocalDateTime expiresAt) {
		return new AuthSession(token, kakaoAccount, expiresAt);
	}

	@jakarta.persistence.PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}

	public String getToken() {
		return token;
	}

	public KakaoAccount getKakaoAccount() {
		return kakaoAccount;
	}

	public LocalDateTime getExpiresAt() {
		return expiresAt;
	}
}
