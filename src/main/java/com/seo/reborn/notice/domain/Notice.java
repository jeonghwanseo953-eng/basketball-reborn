package com.seo.reborn.notice.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "notices", indexes = {
	@Index(name = "idx_notices_pinned_created", columnList = "pinned, createdAt")
})
public class Notice {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String title;

	@Column(nullable = false, columnDefinition = "TEXT")
	private String content;

	@Column(nullable = false, length = 50)
	private String authorName;

	@Column(nullable = false)
	private boolean pinned;

	@Column(nullable = false, updatable = false)
	private LocalDateTime createdAt;

	@Column(nullable = false)
	private LocalDateTime updatedAt;

	protected Notice() {
	}

	private Notice(String title, String content, String authorName, boolean pinned) {
		this.title = title;
		this.content = content;
		this.authorName = authorName;
		this.pinned = pinned;
	}

	public static Notice create(String title, String content, String authorName, boolean pinned) {
		return new Notice(title, content, authorName, pinned);
	}

	public void update(String title, String content, String authorName, boolean pinned) {
		this.title = title;
		this.content = content;
		this.authorName = authorName;
		this.pinned = pinned;
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

	public String getTitle() {
		return title;
	}

	public String getContent() {
		return content;
	}

	public String getAuthorName() {
		return authorName;
	}

	public boolean isPinned() {
		return pinned;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public LocalDateTime getUpdatedAt() {
		return updatedAt;
	}
}
