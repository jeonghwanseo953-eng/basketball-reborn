package com.seo.reborn.attendance.service;

import com.seo.reborn.attendance.domain.AttendanceStatus;
import com.seo.reborn.attendance.domain.AttendanceVote;
import com.seo.reborn.attendance.dto.AttendanceSummaryResponse;
import com.seo.reborn.attendance.dto.AttendanceVoteRequest;
import com.seo.reborn.attendance.dto.AttendanceVoteResponse;
import com.seo.reborn.attendance.repository.AttendanceVoteRepository;
import com.seo.reborn.gameday.domain.GameDay;
import com.seo.reborn.gameday.domain.GameDayStatus;
import com.seo.reborn.gameday.repository.GameDayRepository;
import com.seo.reborn.member.domain.Member;
import com.seo.reborn.member.repository.MemberRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class AttendanceVoteService {

	private final AttendanceVoteRepository attendanceVoteRepository;
	private final GameDayRepository gameDayRepository;
	private final MemberRepository memberRepository;

	public AttendanceVoteService(AttendanceVoteRepository attendanceVoteRepository,
		GameDayRepository gameDayRepository,
		MemberRepository memberRepository) {
		this.attendanceVoteRepository = attendanceVoteRepository;
		this.gameDayRepository = gameDayRepository;
		this.memberRepository = memberRepository;
	}

	public List<AttendanceVoteResponse> findAll(Long gameDayId) {
		if (gameDayId == null) {
			return attendanceVoteRepository.findAll().stream()
				.map(AttendanceVoteResponse::from)
				.toList();
		}

		return attendanceVoteRepository.findAllByGameDay_Id(gameDayId).stream()
			.map(AttendanceVoteResponse::from)
			.toList();
	}

	public AttendanceVoteResponse findById(Long id) {
		return AttendanceVoteResponse.from(getVote(id));
	}

	public AttendanceSummaryResponse summarize(Long gameDayId) {
		if (!gameDayRepository.existsById(gameDayId)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "GameDay not found: " + gameDayId);
		}

		long attendingCount = attendanceVoteRepository.countByGameDay_IdAndStatus(gameDayId, AttendanceStatus.ATTENDING);
		long absentCount = attendanceVoteRepository.countByGameDay_IdAndStatus(gameDayId, AttendanceStatus.ABSENT);
		long undecidedCount = attendanceVoteRepository.countByGameDay_IdAndStatus(gameDayId, AttendanceStatus.UNDECIDED);

		return new AttendanceSummaryResponse(
			gameDayId,
			attendingCount,
			absentCount,
			undecidedCount,
			attendingCount + absentCount + undecidedCount
		);
	}

	@Transactional
	public AttendanceVoteResponse create(AttendanceVoteRequest request) {
		GameDay gameDay = getGameDay(request.gameDayId());
		validateScheduledGameDay(gameDay);
		Member member = getMemberOrNull(request.memberId());
		String voterName = resolveVoterName(member, request.voterName());
		validateDuplicate(null, gameDay.getId(), member, voterName);

		AttendanceVote vote = AttendanceVote.create(
			gameDay,
			member,
			voterName,
			request.status(),
			request.memo()
		);

		return AttendanceVoteResponse.from(attendanceVoteRepository.save(vote));
	}

	@Transactional
	public AttendanceVoteResponse update(Long id, AttendanceVoteRequest request) {
		AttendanceVote vote = getVote(id);
		GameDay gameDay = getGameDay(request.gameDayId());
		validateScheduledGameDay(gameDay);
		Member member = getMemberOrNull(request.memberId());
		String voterName = resolveVoterName(member, request.voterName());
		validateDuplicate(id, gameDay.getId(), member, voterName);

		vote.update(
			gameDay,
			member,
			voterName,
			request.status(),
			request.memo()
		);

		return AttendanceVoteResponse.from(vote);
	}

	@Transactional
	public void delete(Long id) {
		if (!attendanceVoteRepository.existsById(id)) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "AttendanceVote not found: " + id);
		}

		attendanceVoteRepository.deleteById(id);
	}

	private AttendanceVote getVote(Long id) {
		return attendanceVoteRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "AttendanceVote not found: " + id));
	}

	private GameDay getGameDay(Long id) {
		return gameDayRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "GameDay not found: " + id));
	}

	private void validateScheduledGameDay(GameDay gameDay) {
		if (gameDay.getStatus() != GameDayStatus.SCHEDULED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Attendance voting is only available for scheduled games");
		}
	}

	private Member getMemberOrNull(Long id) {
		if (id == null) {
			return null;
		}

		return memberRepository.findById(id)
			.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found: " + id));
	}

	private String resolveVoterName(Member member, String voterName) {
		if (member != null) {
			return null;
		}

		if (voterName == null || voterName.isBlank()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "memberId or voterName is required");
		}

		return voterName.trim();
	}

	private void validateDuplicate(Long currentVoteId, Long gameDayId, Member member, String voterName) {
		boolean duplicated;
		if (member != null) {
			Long memberId = member.getId();
			duplicated = currentVoteId == null
				? attendanceVoteRepository.existsByGameDay_IdAndMember_Id(gameDayId, memberId)
				: attendanceVoteRepository.existsByGameDay_IdAndMember_IdAndIdNot(gameDayId, memberId, currentVoteId);
		} else {
			duplicated = currentVoteId == null
				? attendanceVoteRepository.existsByGameDay_IdAndVoterNameIgnoreCase(gameDayId, voterName)
				: attendanceVoteRepository.existsByGameDay_IdAndVoterNameIgnoreCaseAndIdNot(gameDayId, voterName, currentVoteId);
		}

		if (duplicated) {
			throw new ResponseStatusException(HttpStatus.CONFLICT, "Attendance vote already exists");
		}
	}
}
