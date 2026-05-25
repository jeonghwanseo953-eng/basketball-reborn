package com.seo.reborn.notice.repository;

import com.seo.reborn.notice.domain.NoticeComment;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeCommentRepository extends JpaRepository<NoticeComment, Long> {

	List<NoticeComment> findAllByNoticeIdOrderByCreatedAtAsc(Long noticeId);

	void deleteByNoticeId(Long noticeId);
}
