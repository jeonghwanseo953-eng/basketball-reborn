package com.seo.reborn.notice.controller;

import com.seo.reborn.auth.service.AuthService;
import com.seo.reborn.notice.dto.NoticeCommentRequest;
import com.seo.reborn.notice.dto.NoticeCommentResponse;
import com.seo.reborn.notice.dto.NoticeRequest;
import com.seo.reborn.notice.dto.NoticeResponse;
import com.seo.reborn.notice.service.NoticeService;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notices")
public class NoticeController {

	private final NoticeService noticeService;
	private final AuthService authService;

	public NoticeController(NoticeService noticeService, AuthService authService) {
		this.noticeService = noticeService;
		this.authService = authService;
	}

	@GetMapping
	public List<NoticeResponse> findAll() {
		return noticeService.findAll();
	}

	@GetMapping("/{id}")
	public NoticeResponse findById(@PathVariable Long id) {
		return noticeService.findById(id);
	}

	@PostMapping
	public ResponseEntity<NoticeResponse> create(
		@RequestHeader(value = "X-Reborn-Auth-Token", required = false) String token,
		@Valid @RequestBody NoticeRequest request
	) {
		NoticeResponse response = noticeService.create(request, authService.resolveWriteAuthorName(token));
		return ResponseEntity.created(URI.create("/api/notices/" + response.id())).body(response);
	}

	@PutMapping("/{id}")
	public NoticeResponse update(
		@PathVariable Long id,
		@RequestHeader(value = "X-Reborn-Auth-Token", required = false) String token,
		@Valid @RequestBody NoticeRequest request
	) {
		return noticeService.update(id, request, authService.resolveWriteAuthorName(token));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> delete(
		@PathVariable Long id,
		@RequestHeader(value = "X-Reborn-Auth-Token", required = false) String token
	) {
		noticeService.delete(id, authService.resolveWriteAuthorName(token));
		return ResponseEntity.noContent().build();
	}

	@GetMapping("/{noticeId}/comments")
	public List<NoticeCommentResponse> findComments(@PathVariable Long noticeId) {
		return noticeService.findComments(noticeId);
	}

	@PostMapping("/{noticeId}/comments")
	public ResponseEntity<NoticeCommentResponse> createComment(
		@PathVariable Long noticeId,
		@RequestHeader(value = "X-Reborn-Auth-Token", required = false) String token,
		@Valid @RequestBody NoticeCommentRequest request
	) {
		NoticeCommentResponse response = noticeService.createComment(noticeId, request, authService.resolveWriteAuthorName(token));
		return ResponseEntity.created(URI.create("/api/notices/" + noticeId + "/comments/" + response.id())).body(response);
	}

	@PutMapping("/{noticeId}/comments/{commentId}")
	public NoticeCommentResponse updateComment(
		@PathVariable Long noticeId,
		@PathVariable Long commentId,
		@RequestHeader(value = "X-Reborn-Auth-Token", required = false) String token,
		@Valid @RequestBody NoticeCommentRequest request
	) {
		return noticeService.updateComment(noticeId, commentId, request, authService.resolveWriteAuthorName(token));
	}

	@DeleteMapping("/{noticeId}/comments/{commentId}")
	public ResponseEntity<Void> deleteComment(
		@PathVariable Long noticeId,
		@PathVariable Long commentId,
		@RequestHeader(value = "X-Reborn-Auth-Token", required = false) String token
	) {
		noticeService.deleteComment(noticeId, commentId, authService.resolveWriteAuthorName(token));
		return ResponseEntity.noContent().build();
	}
}
