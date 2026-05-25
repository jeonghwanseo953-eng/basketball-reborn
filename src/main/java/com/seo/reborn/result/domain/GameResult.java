package com.seo.reborn.result.domain;

import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.team.domain.TeamName;
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
import java.time.LocalDateTime;

@Entity
@Table(name = "game_results")
public class GameResult {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "game_day_id", nullable = false)
	private GameDay gameDay;

	@Column(nullable = false)
	private int matchNo;

	@Column(nullable = false)
	private int quarterNo;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TeamName team1Name;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TeamName team2Name;

	@Column(nullable = false)
	private int team1Score;

	@Column(nullable = false)
	private int team2Score;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private ResultOutcome outcome;

	@Column(length = 500)
	private String memo;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected GameResult() {
	}

	private GameResult(GameDay gameDay, int matchNo, int quarterNo, TeamName team1Name,
		TeamName team2Name, int team1Score, int team2Score, String memo) {
		this.gameDay = gameDay;
		this.matchNo = matchNo;
		this.quarterNo = quarterNo;
		this.team1Name = team1Name;
		this.team2Name = team2Name;
		this.team1Score = team1Score;
		this.team2Score = team2Score;
		this.outcome = calculateOutcome(team1Score, team2Score);
		this.memo = memo;
	}

	public static GameResult create(GameDay gameDay, int matchNo, int quarterNo, TeamName team1Name,
		TeamName team2Name, int team1Score, int team2Score, String memo) {
		return new GameResult(gameDay, matchNo, quarterNo, team1Name, team2Name, team1Score, team2Score, memo);
	}

	public void update(GameDay gameDay, int matchNo, int quarterNo, TeamName team1Name,
		TeamName team2Name, int team1Score, int team2Score, String memo) {
		this.gameDay = gameDay;
		this.matchNo = matchNo;
		this.quarterNo = quarterNo;
		this.team1Name = team1Name;
		this.team2Name = team2Name;
		this.team1Score = team1Score;
		this.team2Score = team2Score;
		this.outcome = calculateOutcome(team1Score, team2Score);
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

	private static ResultOutcome calculateOutcome(int team1Score, int team2Score) {
		if (team1Score > team2Score) {
			return ResultOutcome.TEAM1_WIN;
		}

		if (team2Score > team1Score) {
			return ResultOutcome.TEAM2_WIN;
		}

		return ResultOutcome.DRAW;
	}

	public Long getId() {
		return id;
	}

	public GameDay getGameDay() {
		return gameDay;
	}

	public int getMatchNo() {
		return matchNo;
	}

	public int getQuarterNo() {
		return quarterNo;
	}

	public TeamName getTeam1Name() {
		return team1Name;
	}

	public TeamName getTeam2Name() {
		return team2Name;
	}

	public int getTeam1Score() {
		return team1Score;
	}

	public int getTeam2Score() {
		return team2Score;
	}

	public ResultOutcome getOutcome() {
		return outcome;
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
