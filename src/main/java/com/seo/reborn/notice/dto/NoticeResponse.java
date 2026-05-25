package com.seo.reborn.notice.dto;

import com.seo.reborn.notice.domain.Notice;
import java.time.LocalDateTime;

public record NoticeResponse(
	Long id,
	String title,
	String content,
	String authorName,
	boolean pinned,
	LocalDateTime createdAt,
	LocalDateTime updatedAt
) {

	public static NoticeResponse from(Notice notice) {
		return new NoticeResponse(
			notice.getId(),
			notice.getTitle(),
			notice.getContent(),
			notice.getAuthorName(),
			notice.isPinned(),
			notice.getCreatedAt(),
			notice.getUpdatedAt()
		);
	}
}
