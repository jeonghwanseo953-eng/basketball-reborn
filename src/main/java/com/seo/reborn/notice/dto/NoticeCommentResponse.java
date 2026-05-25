package com.seo.reborn.notice.dto;

import com.seo.reborn.notice.domain.NoticeComment;
import java.time.LocalDateTime;

public record NoticeCommentResponse(
	Long id,
	Long noticeId,
	String authorName,
	String content,
	LocalDateTime createdAt
) {

	public static NoticeCommentResponse from(NoticeComment comment) {
		return new NoticeCommentResponse(
			comment.getId(),
			comment.getNotice().getId(),
			comment.getAuthorName(),
			comment.getContent(),
			comment.getCreatedAt()
		);
	}
}
