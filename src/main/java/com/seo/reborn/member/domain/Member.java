package com.seo.reborn.member.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "members", indexes = {
	@Index(name = "idx_members_role", columnList = "role"),
	@Index(name = "idx_members_status_name", columnList = "status, name")
})
public class Member {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 50)
	private String name;

	private Integer birthYear;

	private Integer height;

	@Column(length = 30)
	private String position;

	@Column(length = 50)
	private String region;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private MemberRole role = MemberRole.NONE;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private MemberStatus status;

	@Column(length = 500)
	private String memo;

	@Lob
	private String profileImageUrl;

	private LocalDate restUntilDate;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected Member() {
	}

	private Member(String name, Integer birthYear, Integer height, String position, String region, MemberRole role,
		MemberStatus status, String memo, LocalDate restUntilDate) {
		this.name = name;
		this.birthYear = birthYear;
		this.height = height;
		this.position = position;
		this.region = region;
		this.role = role == null ? MemberRole.NONE : role;
		this.status = status;
		this.memo = memo;
		this.restUntilDate = restUntilDate;
	}

	public static Member create(String name, Integer birthYear, Integer height, String position,
		String region, MemberRole role, MemberStatus status, String memo, LocalDate restUntilDate) {
		return new Member(name, birthYear, height, position, region, role,
			status == null ? MemberStatus.REGULAR : status, memo, restUntilDate);
	}

	public void update(String name, Integer birthYear, Integer height, String position, String region,
		MemberRole role, MemberStatus status, String memo, LocalDate restUntilDate) {
		this.name = name;
		this.birthYear = birthYear;
		this.height = height;
		this.position = position;
		this.region = region;
		this.role = role == null ? MemberRole.NONE : role;
		this.status = status == null ? MemberStatus.REGULAR : status;
		this.memo = memo;
		this.restUntilDate = restUntilDate;
	}

	public void updateProfileImage(String profileImageUrl) {
		this.profileImageUrl = profileImageUrl;
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

	public String getName() {
		return name;
	}

	public Integer getBirthYear() {
		return birthYear;
	}

	public Integer getHeight() {
		return height;
	}

	public String getPosition() {
		return position;
	}

	public String getRegion() {
		return region;
	}

	public MemberRole getRole() {
		return role;
	}

	public MemberStatus getStatus() {
		return status;
	}

	public String getMemo() {
		return memo;
	}

	public String getProfileImageUrl() {
		return profileImageUrl;
	}

	public LocalDate getRestUntilDate() {
		return restUntilDate;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
