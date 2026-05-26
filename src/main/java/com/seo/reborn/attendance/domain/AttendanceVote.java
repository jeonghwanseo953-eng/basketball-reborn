package com.seo.reborn.attendance.domain;

import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_votes", indexes = {
	@Index(name = "idx_attendance_votes_game_day", columnList = "game_day_id"),
	@Index(name = "idx_attendance_votes_game_day_status", columnList = "game_day_id, status"),
	@Index(name = "idx_attendance_votes_game_day_member", columnList = "game_day_id, member_id"),
	@Index(name = "idx_attendance_votes_game_day_voter", columnList = "game_day_id, voterName")
})
public class AttendanceVote {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "game_day_id", nullable = false)
	private GameDay gameDay;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "member_id")
	private Member member;

	@Column(length = 50)
	private String voterName;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private AttendanceStatus status;

	@Column(length = 500)
	private String memo;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected AttendanceVote() {
	}

	private AttendanceVote(GameDay gameDay, Member member, String voterName, AttendanceStatus status, String memo) {
		this.gameDay = gameDay;
		this.member = member;
		this.voterName = voterName;
		this.status = status;
		this.memo = memo;
	}

	public static AttendanceVote create(GameDay gameDay, Member member, String voterName,
		AttendanceStatus status, String memo) {
		return new AttendanceVote(gameDay, member, voterName,
			status == null ? AttendanceStatus.UNDECIDED : status,
			memo);
	}

	public void update(GameDay gameDay, Member member, String voterName, AttendanceStatus status, String memo) {
		this.gameDay = gameDay;
		this.member = member;
		this.voterName = voterName;
		this.status = status == null ? AttendanceStatus.UNDECIDED : status;
		this.memo = memo;
	}

	@PrePersist
	void prePersist() {
		LocalDateTime now = LocalDateTime.now();
		this.createdAt = now;
		this.updatedAt = now;
	}

	@PreUpdate
	void preUpdate() {
		this.updatedAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public GameDay getGameDay() {
		return gameDay;
	}

	public Member getMember() {
		return member;
	}

	public String getVoterName() {
		return voterName;
	}

	public AttendanceStatus getStatus() {
		return status;
	}

	public String getMemo() {
		return memo;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
