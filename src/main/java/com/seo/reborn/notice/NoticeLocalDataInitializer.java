package com.seo.reborn.notice;

import com.seo.reborn.notice.domain.Notice;
import com.seo.reborn.notice.domain.NoticeComment;
import com.seo.reborn.notice.repository.NoticeCommentRepository;
import com.seo.reborn.notice.repository.NoticeRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Profile("local")
public class NoticeLocalDataInitializer implements ApplicationRunner {

	private final NoticeRepository noticeRepository;
	private final NoticeCommentRepository noticeCommentRepository;

	public NoticeLocalDataInitializer(
		NoticeRepository noticeRepository,
		NoticeCommentRepository noticeCommentRepository
	) {
		this.noticeRepository = noticeRepository;
		this.noticeCommentRepository = noticeCommentRepository;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		noticeCommentRepository.deleteAll();
		noticeRepository.deleteAll();

		Notice feeNotice = noticeRepository.save(Notice.create(
			"5월 회비 납부 안내",
			"5월 회비 납부 계좌와 게스트비 기준을 확인해주세요.\n정회원 회비와 게스트비는 이번 주 운동 전까지 정리하겠습니다.",
			"한을",
			true
		));
		Notice gameNotice = noticeRepository.save(Notice.create(
			"정규 게임 준비물 안내",
			"매주 화요일 정규 게임은 송파청소년센터에서 19:00-21:00에 진행합니다.\n개인 물통과 흰색/검은색 상의를 챙겨주세요.",
			"김성호",
			true
		));
		Notice vestNotice = noticeRepository.save(Notice.create(
			"팀 조끼 세탁 담당 공유",
			"이번 주 사용한 팀 조끼는 다음 운동 전까지 세탁 후 가져와주세요.\n담당자는 댓글로 확인 남겨주세요.",
			"전성훈",
			false
		));
		Notice guestNotice = noticeRepository.save(Notice.create(
			"게스트 참석 안내",
			"게스트 참석자는 사전에 운영진에게 이름과 포지션을 알려주세요.\n참석 인원이 많을 경우 정회원 참석을 우선합니다.",
			"서민균",
			false
		));

		noticeCommentRepository.save(NoticeComment.create(feeNotice, "김성호", "확인했습니다. 이번 주 안으로 납부 안내 한 번 더 공유할게요."));
		noticeCommentRepository.save(NoticeComment.create(feeNotice, "서정환", "게스트비도 같은 계좌로 보내면 될까요?"));
		noticeCommentRepository.save(NoticeComment.create(gameNotice, "곽호승", "검은 상의 챙겨가겠습니다."));
		noticeCommentRepository.save(NoticeComment.create(gameNotice, "한경원", "공은 제가 하나 가져갈게요."));
		noticeCommentRepository.save(NoticeComment.create(vestNotice, "임문규", "이번 주 조끼는 제가 세탁하겠습니다."));
		noticeCommentRepository.save(NoticeComment.create(guestNotice, "오민형", "게스트 오면 미리 공유하겠습니다."));
	}
}
