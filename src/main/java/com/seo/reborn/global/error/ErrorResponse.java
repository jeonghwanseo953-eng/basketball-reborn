package com.seo.reborn.global.error;

import java.time.LocalDateTime;
import java.util.List;

public record ErrorResponse(
	LocalDateTime timestamp,
	int status,
	String code,
	String message,
	List<ErrorFieldResponse> errors
) {

	public static ErrorResponse of(int status, String code, String message) {
		return new ErrorResponse(
			LocalDateTime.now(),
			status,
			code,
			message,
			List.of()
		);
	}

	public static ErrorResponse of(int status, String code, String message, List<ErrorFieldResponse> errors) {
		return new ErrorResponse(
			LocalDateTime.now(),
			status,
			code,
			message,
			errors
		);
	}
}
