package com.seo.reborn.notice.service;

import com.seo.reborn.notice.domain.Notice;
import com.seo.reborn.notice.domain.NoticeComment;
import com.seo.reborn.notice.dto.NoticeCommentRequest;
import com.seo.reborn.notice.dto.NoticeCommentResponse;
import com.seo.reborn.notice.dto.NoticeRequest;
import com.seo.reborn.notice.dto.NoticeResponse;
import com.seo.reborn.notice.repository.NoticeCommentRepository;
import com.seo.reborn.notice.repository.NoticeRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class NoticeService {

	private final NoticeRepository noticeRepository;
	private final NoticeCommentRepository noticeCommentRepository;

	public NoticeService(NoticeRepository noticeRepository, NoticeCommentRepository noticeCommentRepository) {
		this.noticeRepository = noticeRepository;
		this.noticeCommentRepository = noticeCommentRepository;
	}

	public List<NoticeResponse> findAll() {
		return noticeRepository.findAllByOrderByPinnedDescCreatedAtDesc().stream()
			.map(NoticeResponse::from)
			.toList();
	}

	public NoticeResponse findById(Long id) {
		return NoticeResponse.from(getNotice(id));
	}

	@Transactional
	public NoticeResponse create(NoticeRequest request, String currentAuthorName) {
		Notice notice = Notice.create(
			request.title(),
			request.content(),
			resolveAuthorName(request.authorName(), currentAuthorName),
			request.pinned()
		);

		return NoticeResponse.from(noticeRepository.save(notice));
	}

	@Transactional
	public NoticeResponse update(Long id, NoticeRequest request, String currentAuthorName) {
		Notice notice = getNotice(id);
		validateAuthor(notice.getAuthorName(), currentAuthorName);
		notice.update(
			request.title(),
			request.content(),
			notice.getAuthorName(),
			request.pinned()
		);

		return NoticeResponse.from(notice);
	}

	@Transactional
	public void delete(Long id, String currentAuthorName) {
		Notice notice = getNotice(id);
		validateAuthor(notice.getAuthorName(), currentAuthorName);
		noticeCommentRepository.deleteByNoticeId(id);
		noticeRepository.delete(notice);
	}

	public List<NoticeCommentResponse> findComments(Long noticeId) {
		if (!noticeRepository.existsById(noticeId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found: " + noticeId);
		}

		return noticeCommentRepository.findAllByNoticeIdOrderByCreatedAtAsc(noticeId).stream()
			.map(NoticeCommentResponse::from)
			.toList();
	}

	@Transactional
	public NoticeCommentResponse createComment(Long noticeId, NoticeCommentRequest request, String currentAuthorName) {
		Notice notice = getNotice(noticeId);
		NoticeComment comment = NoticeComment.create(notice, resolveAuthorName(request.authorName(), currentAuthorName), request.content());

		return NoticeCommentResponse.from(noticeCommentRepository.save(comment));
	}

	@Transactional
	public NoticeCommentResponse updateComment(Long noticeId, Long commentId, NoticeCommentRequest request, String currentAuthorName) {
		NoticeComment comment = getCommentForNotice(noticeId, commentId);
		validateAuthor(comment.getAuthorName(), currentAuthorName);
		comment.update(request.content());

		return NoticeCommentResponse.from(comment);
	}

	@Transactional
	public void deleteComment(Long noticeId, Long commentId, String currentAuthorName) {
		NoticeComment comment = getCommentForNotice(noticeId, commentId);
		validateAuthor(comment.getAuthorName(), currentAuthorName);
		noticeCommentRepository.delete(comment);
	}

	private NoticeComment getCommentForNotice(Long noticeId, Long commentId) {
		NoticeComment comment = noticeCommentRepository.findById(commentId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice comment not found: " + commentId));

		if (!comment.getNotice().getId().equals(noticeId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice comment not found: " + commentId);
		}

		return comment;
	}

	private Notice getNotice(Long id) {
		return noticeRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found: " + id));
	}

	private String resolveAuthorName(String requestAuthorName, String currentAuthorName) {
		if (currentAuthorName != null && !currentAuthorName.isBlank()) {
			return currentAuthorName.trim();
		}

		return requestAuthorName;
	}

	private void validateAuthor(String authorName, String currentAuthorName) {
		if (currentAuthorName == null || currentAuthorName.isBlank()) {
			return;
		}

		if (!authorName.equals(currentAuthorName.trim())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인이 작성한 글과 댓글만 수정/삭제할 수 있습니다.");
		}
	}
}
