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
	public NoticeResponse create(NoticeRequest request) {
		Notice notice = Notice.create(
			request.title(),
			request.content(),
			request.authorName(),
			request.pinned()
		);

		return NoticeResponse.from(noticeRepository.save(notice));
	}

	@Transactional
	public NoticeResponse update(Long id, NoticeRequest request) {
		Notice notice = getNotice(id);
		notice.update(
			request.title(),
			request.content(),
			request.authorName(),
			request.pinned()
		);

		return NoticeResponse.from(notice);
	}

	@Transactional
	public void delete(Long id) {
		if (!noticeRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found: " + id);
		}

		noticeCommentRepository.deleteByNoticeId(id);
		noticeRepository.deleteById(id);
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
	public NoticeCommentResponse createComment(Long noticeId, NoticeCommentRequest request) {
		Notice notice = getNotice(noticeId);
		NoticeComment comment = NoticeComment.create(notice, request.authorName(), request.content());

		return NoticeCommentResponse.from(noticeCommentRepository.save(comment));
	}

	@Transactional
	public void deleteComment(Long noticeId, Long commentId) {
		NoticeComment comment = noticeCommentRepository.findById(commentId)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice comment not found: " + commentId));

		if (!comment.getNotice().getId().equals(noticeId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice comment not found: " + commentId);
		}

		noticeCommentRepository.delete(comment);
	}

	private Notice getNotice(Long id) {
		return noticeRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found: " + id));
	}
}
