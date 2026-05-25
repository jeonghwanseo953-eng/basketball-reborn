package com.seo.reborn.auth.repository;

import com.seo.reborn.auth.domain.KakaoAccount;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface KakaoAccountRepository extends JpaRepository<KakaoAccount, Long> {

	Optional<KakaoAccount> findByKakaoId(String kakaoId);

	boolean existsByMemberId(Long memberId);

	boolean existsByMemberIdAndIdNot(Long memberId, Long id);
}
