package com.seo.reborn.team.domain;

import com.seo.reborn.member.domain.Member;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "team_members", indexes = {
	@Index(name = "idx_team_members_team_sort", columnList = "team_id, sortOrder, id"),
	@Index(name = "idx_team_members_member", columnList = "member_id")
})
public class TeamMember {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "team_id", nullable = false)
	private Team team;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "member_id")
	private Member member;

	@Column(length = 50)
	private String playerName;

	@Column(nullable = false)
	private int sortOrder;

	protected TeamMember() {
	}

	private TeamMember(Member member, String playerName, int sortOrder) {
		this.member = member;
		this.playerName = playerName;
		this.sortOrder = sortOrder;
	}

	public static TeamMember create(Member member, String playerName, int sortOrder) {
		return new TeamMember(member, playerName, sortOrder);
	}

	void assignTeam(Team team) {
		this.team = team;
	}

	public Long getId() {
		return id;
	}

	public Member getMember() {
		return member;
	}

	public String getPlayerName() {
		return playerName;
	}

	public int getSortOrder() {
		return sortOrder;
	}
}
