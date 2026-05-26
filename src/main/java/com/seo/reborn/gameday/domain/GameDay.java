package com.seo.reborn.gameday.domain;

import com.seo.reborn.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "game_days")
public class GameDay {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false)
	private LocalDate gameDate;

	@Column(nullable = false, length = 100)
	private String place;

	@Column(nullable = false)
	private LocalTime startTime;

	@Column(nullable = false)
	private LocalTime endTime;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private GameDayMode mode;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private GameDayType gameType;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private GameDayStatus status;

	@Column(length = 500)
	private String memo;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "team_builder_member_id")
	private Member teamBuilder;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected GameDay() {
	}

	private GameDay(LocalDate gameDate, String place, LocalTime startTime, LocalTime endTime,
		GameDayMode mode, GameDayType gameType, GameDayStatus status, String memo, Member teamBuilder) {
		this.gameDate = gameDate;
		this.place = place;
		this.startTime = startTime;
		this.endTime = endTime;
		this.mode = mode;
		this.gameType = gameType;
		this.status = status;
		this.memo = memo;
		this.teamBuilder = teamBuilder;
	}

	public static GameDay create(LocalDate gameDate, String place, LocalTime startTime, LocalTime endTime,
		GameDayMode mode, GameDayType gameType, GameDayStatus status, String memo, Member teamBuilder) {
		return new GameDay(gameDate, place, startTime, endTime,
			mode == null ? GameDayMode.THREE_WAY : mode,
			gameType == null ? GameDayType.REGULAR : gameType,
			status == null ? GameDayStatus.SCHEDULED : status,
			memo,
			teamBuilder);
	}

	public void update(LocalDate gameDate, String place, LocalTime startTime, LocalTime endTime,
		GameDayMode mode, GameDayType gameType, GameDayStatus status, String memo, Member teamBuilder) {
		this.gameDate = gameDate;
		this.place = place;
		this.startTime = startTime;
		this.endTime = endTime;
		this.mode = mode == null ? GameDayMode.THREE_WAY : mode;
		this.gameType = gameType == null ? GameDayType.REGULAR : gameType;
		this.status = status == null ? GameDayStatus.SCHEDULED : status;
		this.memo = memo;
		this.teamBuilder = teamBuilder;
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

	public LocalDate getGameDate() {
		return gameDate;
	}

	public String getPlace() {
		return place;
	}

	public LocalTime getStartTime() {
		return startTime;
	}

	public LocalTime getEndTime() {
		return endTime;
	}

	public GameDayMode getMode() {
		return mode;
	}

	public GameDayType getGameType() {
		return gameType;
	}

	public GameDayStatus getStatus() {
		return status;
	}

	public String getMemo() {
		return memo;
	}

	public Member getTeamBuilder() {
		return teamBuilder;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
