import { conflict, notFound } from "../../lib/errors";
import * as repo from "./official-exams.repo";

// ─── Official Exam Sessions ──────────────────────────────────────────

export async function listSessions(
	institutionId: string,
	academicYearId?: string,
	examType?: string,
) {
	return repo.findAllSessions(institutionId, academicYearId, examType);
}

export async function getSession(id: string, institutionId: string) {
	const session = await repo.findSessionById(id, institutionId);
	if (!session) throw notFound("Official exam session not found");
	return session;
}

export async function createSession(
	data: {
		academicYearId: string;
		examType: string;
		sessionYear: number;
		centerCode?: string;
		registrationDeadline?: string;
	},
	institutionId: string,
) {
	return repo.insertSession({
		institutionId,
		academicYearId: data.academicYearId,
		examType: data.examType,
		sessionYear: data.sessionYear,
		centerCode: data.centerCode,
		registrationDeadline: data.registrationDeadline
			? new Date(data.registrationDeadline)
			: null,
	});
}

export async function updateSession(
	id: string,
	institutionId: string,
	data: {
		centerCode?: string;
		registrationDeadline?: string;
	},
) {
	const existing = await repo.findSessionById(id, institutionId);
	if (!existing) throw notFound("Official exam session not found");

	const updateData: Record<string, unknown> = {};
	if (data.centerCode !== undefined) updateData.centerCode = data.centerCode;
	if (data.registrationDeadline !== undefined) {
		updateData.registrationDeadline = data.registrationDeadline
			? new Date(data.registrationDeadline)
			: null;
	}

	const updated = await repo.updateSession(
		id,
		institutionId,
		updateData as any,
	);
	return updated!;
}

// ─── Official Exam Registrations ─────────────────────────────────────

export async function listRegistrations(
	examSessionId: string,
	institutionId: string,
	isEligible?: boolean,
	isAdmitted?: boolean,
) {
	// Verify session exists
	const session = await repo.findSessionById(examSessionId, institutionId);
	if (!session) throw notFound("Official exam session not found");

	return repo.findAllRegistrations(
		examSessionId,
		institutionId,
		isEligible,
		isAdmitted,
	);
}

export async function getRegistration(id: string, institutionId: string) {
	const registration = await repo.findRegistrationById(id, institutionId);
	if (!registration) throw notFound("Candidate registration not found");
	return registration;
}

export async function registerCandidate(
	data: {
		examSessionId: string;
		enrollmentId: string;
		candidateNumber?: string;
		isEligible?: boolean;
		hasPaidFee?: boolean;
	},
	institutionId: string,
) {
	// Verify session exists
	const session = await repo.findSessionById(data.examSessionId, institutionId);
	if (!session) throw notFound("Official exam session not found");

	// Check if candidate already registered
	const existing = await repo.findRegistrationBySessionAndEnrollment(
		data.examSessionId,
		data.enrollmentId,
		institutionId,
	);
	if (existing) {
		throw conflict(
			"This candidate is already registered for this exam session",
		);
	}

	return repo.insertRegistration({
		institutionId,
		examSessionId: data.examSessionId,
		enrollmentId: data.enrollmentId,
		candidateNumber: data.candidateNumber,
		isEligible: data.isEligible ?? true,
		hasPaidFee: data.hasPaidFee ?? false,
	});
}

export async function updateRegistration(
	id: string,
	institutionId: string,
	data: {
		candidateNumber?: string;
		isEligible?: boolean;
		hasPaidFee?: boolean;
		isAdmitted?: boolean;
		mention?: string;
	},
) {
	const existing = await repo.findRegistrationById(id, institutionId);
	if (!existing) throw notFound("Candidate registration not found");

	const updateData: Record<string, unknown> = {};
	if (data.candidateNumber !== undefined) {
		updateData.candidateNumber = data.candidateNumber;
	}
	if (data.isEligible !== undefined) updateData.isEligible = data.isEligible;
	if (data.hasPaidFee !== undefined) updateData.hasPaidFee = data.hasPaidFee;
	if (data.isAdmitted !== undefined) updateData.isAdmitted = data.isAdmitted;
	if (data.mention !== undefined) updateData.mention = data.mention;

	const updated = await repo.updateRegistration(
		id,
		institutionId,
		updateData as any,
	);
	return updated!;
}
