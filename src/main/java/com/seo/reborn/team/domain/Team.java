package com.seo.reborn.team.domain;

import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.member.domain.Member;
import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "teams", indexes = {
	@Index(name = "idx_teams_game_day", columnList = "game_day_id"),
	@Index(name = "idx_teams_game_day_name", columnList = "game_day_id, name")
})
public class Team {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "game_day_id", nullable = false)
	private GameDay gameDay;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private TeamName name;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "captain_member_id")
	private Member captain;

	@Column(length = 500)
	private String memo;

	@OneToMany(mappedBy = "team", cascade = CascadeType.ALL, orphanRemoval = true)
	@OrderBy("sortOrder ASC, id ASC")
	private final List<TeamMember> members = new ArrayList<>();

	protected Team() {
	}

	private Team(GameDay gameDay, TeamName name, Member captain, String memo) {
		this.gameDay = gameDay;
		this.name = name;
		this.captain = captain;
		this.memo = memo;
	}

	public static Team create(GameDay gameDay, TeamName name, Member captain, String memo) {
		return new Team(gameDay, name, captain, memo);
	}

	public void update(GameDay gameDay, TeamName name, Member captain, String memo) {
		this.gameDay = gameDay;
		this.name = name;
		this.captain = captain;
		this.memo = memo;
		this.members.clear();
	}

	public void addMember(TeamMember member) {
		member.assignTeam(this);
		this.members.add(member);
	}

	public Long getId() {
		return id;
	}

	public GameDay getGameDay() {
		return gameDay;
	}

	public TeamName getName() {
		return name;
	}

	public Member getCaptain() {
		return captain;
	}

	public String getMemo() {
		return memo;
	}

	public List<TeamMember> getMembers() {
		return members;
	}
}
