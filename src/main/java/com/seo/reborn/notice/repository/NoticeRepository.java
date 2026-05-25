package com.seo.reborn.notice.repository;

import com.seo.reborn.notice.domain.Notice;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

	List<Notice> findAllByOrderByPinnedDescCreatedAtDesc();

	List<Notice> findTop5ByOrderByPinnedDescCreatedAtDesc();
}
