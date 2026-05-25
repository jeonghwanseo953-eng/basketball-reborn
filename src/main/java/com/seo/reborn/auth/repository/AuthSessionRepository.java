package com.seo.reborn.auth.repository;

import com.seo.reborn.auth.domain.AuthSession;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthSessionRepository extends JpaRepository<AuthSession, Long> {

	Optional<AuthSession> findByTokenAndExpiresAtAfter(String token, LocalDateTime now);
}
