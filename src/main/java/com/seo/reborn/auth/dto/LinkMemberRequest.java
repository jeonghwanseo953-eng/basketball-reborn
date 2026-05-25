package com.seo.reborn.auth.dto;

import jakarta.validation.constraints.NotNull;

public record LinkMemberRequest(@NotNull Long memberId) {
}
