package com.seo.reborn.notice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoticeCommentRequest(
	@NotBlank
	@Size(max = 50)
	String authorName,

	@NotBlank
	String content
) {
}
