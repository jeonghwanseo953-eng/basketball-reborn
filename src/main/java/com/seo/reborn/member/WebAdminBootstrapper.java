package com.seo.reborn.member;

import com.seo.reborn.member.domain.MemberRole;
import com.seo.reborn.member.repository.MemberRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class WebAdminBootstrapper implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(WebAdminBootstrapper.class);

	private final MemberRepository memberRepository;
	private final String bootstrapWebAdminName;

	public WebAdminBootstrapper(
		MemberRepository memberRepository,
		@Value("${app.bootstrap.web-admin-name:}") String bootstrapWebAdminName
	) {
		this.memberRepository = memberRepository;
		this.bootstrapWebAdminName = bootstrapWebAdminName;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (bootstrapWebAdminName.isBlank() || memberRepository.findFirstByRole(MemberRole.WEB_ADMIN).isPresent()) {
			return;
		}

		memberRepository.findFirstByName(bootstrapWebAdminName)
			.ifPresent(member -> {
				member.assignRole(MemberRole.WEB_ADMIN);
				log.info("Assigned WEB_ADMIN role to {}", member.getName());
			});
	}
}
