package com.seo.reborn.global.error;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException exception) {
		List<ErrorFieldResponse> errors = exception.getBindingResult().getFieldErrors().stream()
			.map(this::toFieldResponse)
			.toList();

		return ResponseEntity.badRequest().body(ErrorResponse.of(
			HttpStatus.BAD_REQUEST.value(),
			"VALIDATION_ERROR",
			"Invalid request",
			errors
		));
	}

	@ExceptionHandler(ResponseStatusException.class)
	public ResponseEntity<ErrorResponse> handleResponseStatus(ResponseStatusException exception) {
		HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
		String message = exception.getReason() == null ? status.getReasonPhrase() : exception.getReason();

		return ResponseEntity.status(status).body(ErrorResponse.of(
			status.value(),
			status.name(),
			message
		));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ErrorResponse> handleUnexpected(Exception exception) {
		return ResponseEntity.internalServerError().body(ErrorResponse.of(
			HttpStatus.INTERNAL_SERVER_ERROR.value(),
			"INTERNAL_SERVER_ERROR",
			"Unexpected server error"
		));
	}

	private ErrorFieldResponse toFieldResponse(FieldError fieldError) {
		return new ErrorFieldResponse(
			fieldError.getField(),
			fieldError.getDefaultMessage()
		);
	}
}
