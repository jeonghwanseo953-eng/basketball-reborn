package com.seo.reborn.notice.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "notice_comments")
public class NoticeComment {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "notice_id", nullable = false)
	private Notice notice;

	@Column(nullable = false, length = 50)
	private String authorName;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	protected NoticeComment() {
	}

	private NoticeComment(Notice notice, String authorName, String content) {
		this.notice = notice;
		this.authorName = authorName;
		this.content = content;
	}

	public static NoticeComment create(Notice notice, String authorName, String content) {
		return new NoticeComment(notice, authorName, content);
	}

	public void update(String content) {
		this.content = content;
	}

	@PrePersist
	void prePersist() {
		this.createdAt = LocalDateTime.now();
	}

	public Long getId() {
		return id;
	}

	public Notice getNotice() {
		return notice;
	}

	public String getAuthorName() {
		return authorName;
	}

	public String getContent() {
		return content;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}
}
