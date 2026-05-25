package com.seo.reborn.auth.dto;

import jakarta.validation.constraints.NotBlank;

public record KakaoCallbackRequest(
	@NotBlank String code,
	@NotBlank String redirectUri
) {
}
