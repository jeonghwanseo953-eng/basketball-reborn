package com.seo.reborn.notice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record NoticeRequest(
	@NotBlank
	@Size(max = 100)
	String title,

	@NotBlank
	String content,

	@NotBlank
	@Size(max = 50)
	String authorName,

	boolean pinned
) {
}
