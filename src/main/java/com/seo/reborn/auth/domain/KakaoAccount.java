package com.seo.reborn.auth.domain;

import com.seo.reborn.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "kakao_accounts")
public class KakaoAccount {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 50)
	private String kakaoId;

	@Column(length = 100)
	private String nickname;

	@OneToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "member_id", unique = true)
	private Member member;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected KakaoAccount() {
	}

	private KakaoAccount(String kakaoId, String nickname) {
		this.kakaoId = kakaoId;
		this.nickname = nickname;
	}

	public static KakaoAccount create(String kakaoId, String nickname) {
		return new KakaoAccount(kakaoId, nickname);
	}

	public void updateProfile(String nickname) {
		this.nickname = nickname;
	}

	public void linkMember(Member member) {
		this.member = member;
	}

	@jakarta.persistence.PrePersist
	void prePersist() {
		LocalDateTime now = LocalDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@jakarta.persistence.PreUpdate
	void preUpdate() {
		this.updatedAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public String getKakaoId() {
		return kakaoId;
	}

	public String getNickname() {
		return nickname;
	}

	public Member getMember() {
		return member;
	}
}
