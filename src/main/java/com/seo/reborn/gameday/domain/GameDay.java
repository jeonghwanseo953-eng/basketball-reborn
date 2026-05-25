package com.seo.reborn.gameday.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected GameDay() {
	}

	private GameDay(LocalDate gameDate, String place, LocalTime startTime, LocalTime endTime,
		GameDayMode mode, GameDayType gameType, GameDayStatus status, String memo) {
		this.gameDate = gameDate;
		this.place = place;
		this.startTime = startTime;
		this.endTime = endTime;
		this.mode = mode;
		this.gameType = gameType;
		this.status = status;
		this.memo = memo;
	}

	public static GameDay create(LocalDate gameDate, String place, LocalTime startTime, LocalTime endTime,
		GameDayMode mode, GameDayType gameType, GameDayStatus status, String memo) {
		return new GameDay(gameDate, place, startTime, endTime,
			mode == null ? GameDayMode.THREE_WAY : mode,
			gameType == null ? GameDayType.REGULAR : gameType,
			status == null ? GameDayStatus.SCHEDULED : status,
			memo);
	}

	public void update(LocalDate gameDate, String place, LocalTime startTime, LocalTime endTime,
		GameDayMode mode, GameDayType gameType, GameDayStatus status, String memo) {
		this.gameDate = gameDate;
		this.place = place;
		this.startTime = startTime;
		this.endTime = endTime;
		this.mode = mode == null ? GameDayMode.THREE_WAY : mode;
		this.gameType = gameType == null ? GameDayType.REGULAR : gameType;
		this.status = status == null ? GameDayStatus.SCHEDULED : status;
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

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
