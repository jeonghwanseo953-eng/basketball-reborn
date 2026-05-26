package com.seo.reborn.member.repository;

import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.domain.MemberRole;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> {

	Optional<Member> findFirstByRole(MemberRole role);

	Optional<Member> findFirstByName(String name);
}
